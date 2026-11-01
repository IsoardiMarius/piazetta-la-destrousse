"""Prépare les photos du dossier photos/ pour le site.

- redresse les photos prises au téléphone (orientation EXIF) ;
- les met légèrement en valeur, en restant naturel (contraste, couleurs, netteté) ;
- les redimensionne en plusieurs tailles WebP légères (le navigateur choisit la bonne) ;
- crée un minuscule aperçu flou, affiché le temps du chargement ;
- retire les métadonnées (dont la position GPS du téléphone) ;
- écrit la liste dans assets/photos.json, utilisée à la publication ;
- prépare la photo du flyer (assets/flyer-photo.jpg, en haute définition pour l'impression) :
  celle choisie dans Pages CMS (contenu/flyer.json), sinon la 1re photo de l'accueil.

Utilisation : python3 scripts/preparer-photos.py [dossier-de-sortie]
(par défaut, la sortie est le dossier du projet ; en CI, c'est _site).

Logo : python3 scripts/preparer-photos.py --logo [dossier]
Si un logo est choisi dans Pages CMS (contenu/contact.json, champ « logo »), produit toutes
ses tailles dans <dossier>/assets (site, icône d'onglet, icône iPhone, aperçu de lien).
Sans logo choisi, rien n'est modifié : le logo d'origine reste en place.
"""
import base64
import io
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

try:  # photos d'iPhone (.heic)
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "photos"
MODE_LOGO = len(sys.argv) > 1 and sys.argv[1] == "--logo"
_args = sys.argv[2:] if MODE_LOGO else sys.argv[1:]
SORTIE = Path(_args[0]).resolve() if _args else RACINE
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
LARGEURS = (480, 800, 1200, 1600)
MAX_PHOTOS = 16  # même limite que scripts/controler-site.mjs


def slug(texte):
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "photo"


def legende(nom):
    """« 1-la-reine.jpg » → « La reine » ; « IMG_2034.jpg » → pas de légende."""
    base = re.sub(r"^\d+[\s._-]*", "", Path(nom).stem)
    if not base or re.match(r"^(img|dsc|dcim|pxl|photo|image|pizza|wp|screenshot|capture)([\s._-]*\d+)?$", base, re.I) \
            or re.match(r"^(img|dsc|dcim|pxl|wp|screenshot|capture)[\s._-]*\d", base, re.I):
        return ""
    base = re.sub(r"[_-]+", " ", base).strip()
    return base[:1].upper() + base[1:]


def mettre_en_valeur(im):
    """Retouche discrète : un peu de relief et d'éclat, sans changer les couleurs."""
    im = im.filter(ImageFilter.UnsharpMask(radius=24, percent=14, threshold=0))  # relief (contraste local)
    im = ImageEnhance.Contrast(im).enhance(1.03)
    im = ImageEnhance.Color(im).enhance(1.04)
    im = ImageEnhance.Brightness(im).enhance(1.015)
    return im


def photos_a_publier():
    """Liste des photos et de leur description, dans l'ordre choisi.

    Source : contenu/photos.json (modifié depuis Pages CMS). À défaut, toutes les
    photos du dossier photos/, par ordre alphabétique (description tirée du nom)."""
    liste_json = RACINE / "contenu" / "photos.json"
    if liste_json.exists():
        resultat = []
        for i, p in enumerate(json.loads(liste_json.read_text(encoding="utf-8")) or []):
            chemin = str((p or {}).get("image") or "").lstrip("/")
            fichier = RACINE / chemin
            if not chemin or not fichier.is_file():
                print(f"⚠️  Photo n°{i + 1} ignorée : image « {chemin or '(vide)'} » introuvable.")
                continue
            resultat.append((fichier, str(p.get("description") or "").strip(), str(p.get("legende") or "").strip()))
        return resultat
    fichiers = sorted(
        (f for f in SOURCE.iterdir() if f.suffix.lower() in EXTENSIONS),
        key=lambda f: f.name.lower(),
    ) if SOURCE.is_dir() else []
    return [(f, legende(f.name), "") for f in fichiers]


def main():
    fichiers = photos_a_publier()
    if len(fichiers) > MAX_PHOTOS:
        print(f"⚠️  {len(fichiers)} photos trouvées : seules les {MAX_PHOTOS} premières sont affichées.")
        fichiers = fichiers[:MAX_PHOTOS]

    dest = SORTIE / "photos-web"
    dest.mkdir(parents=True, exist_ok=True)
    liste, vus = [], set()

    for f, description, texte in fichiers:
        try:
            im = Image.open(f)
            im = ImageOps.exif_transpose(im).convert("RGB")
        except Exception as e:  # fichier illisible : on le signale sans bloquer le site
            print(f"⚠️  {f.name} ignorée (illisible : {e})")
            continue
        im = mettre_en_valeur(im)
        nom = slug(f.stem)
        while nom in vus:
            nom += "-b"
        vus.add(nom)

        variantes = []
        for largeur in LARGEURS:
            w = min(largeur, im.width)
            h = round(im.height * w / im.width)
            r = im.resize((w, h), Image.LANCZOS) if w < im.width else im.copy()
            r = r.filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=3))
            chemin = dest / f"{nom}-{largeur}.webp"
            r.save(chemin, "WEBP", quality=82, method=6)
            variantes.append((f"photos-web/{chemin.name}", w, h))
            if w < largeur:
                break

        apercu = im.copy()
        apercu.thumbnail((24, 24))
        tampon = io.BytesIO()
        apercu.save(tampon, "WEBP", quality=40)
        lqip = "data:image/webp;base64," + base64.b64encode(tampon.getvalue()).decode()

        moyenne = next((v for v in variantes if v[1] >= 800), variantes[-1])
        grande = variantes[-1]
        liste.append({
            "src": moyenne[0],
            "lqip": lqip,
            "grande": grande[0],
            "srcset": ", ".join(f"{p} {w}w" for p, w, _ in variantes),
            "largeur": grande[1],
            "hauteur": grande[2],
            "legende": description or texte,   # texte lu par Google et les lecteurs d'écran
            "texte": texte,                     # légende affichée sur la photo (facultative)
        })
        if im.width < 1000:
            print(f"⚠️  {f.name} est petite ({im.width} px de large) : elle risque d'être floue. Préférez la photo d'origine.")

    (SORTIE / "assets").mkdir(parents=True, exist_ok=True)
    (SORTIE / "assets" / "photos.json").write_text(json.dumps(liste, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✅ {len(liste)} photo(s) préparée(s).")
    preparer_photo_flyer([f for f, _, _ in fichiers])


COTE_FLYER = 1200  # photo affichée dans un rond de 81 mm : environ 375 points par pouce à l'impression


def preparer_photo_flyer(photos_accueil):
    """Photo du flyer : celle choisie dans Pages CMS, sinon la 1re photo de l'accueil.
    Recadrée en carré centré (elle est affichée dans un rond), en JPEG de qualité impression."""
    sortie = SORTIE / "assets" / "flyer-photo.jpg"
    sortie.unlink(missing_ok=True)
    fichier_flyer = RACINE / "contenu" / "flyer.json"
    choix = str((json.loads(fichier_flyer.read_text(encoding="utf-8")) if fichier_flyer.exists() else {}).get("photo") or "").lstrip("/")
    sources = ([RACINE / choix] if choix else []) + list(photos_accueil)
    for source in sources:
        try:
            im = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
        except Exception as e:  # introuvable ou illisible : la suivante (la 1re photo de l'accueil)
            print(f"⚠️  Photo du flyer « {source.name} » introuvable ou illisible ({e}) : la 1re photo de l'accueil est utilisée.")
            continue
        im = mettre_en_valeur(im)
        cote = min(im.size)
        gauche, haut = (im.width - cote) // 2, (im.height - cote) // 2
        im = im.crop((gauche, haut, gauche + cote, haut + cote))
        if cote > COTE_FLYER:
            im = im.resize((COTE_FLYER, COTE_FLYER), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=35, threshold=3))
        im.save(sortie, "JPEG", quality=90, optimize=True)
        if cote < 900:
            print(f"⚠️  Photo du flyer petite ({cote} px) : elle risque d'être floue à l'impression.")
        print(f"✅ Photo du flyer préparée à partir de « {source.name} ».")
        return
    print("Flyer : aucune photo, le logo est affiché à la place.")


CREME = (246, 240, 230)


def preparer_logo():
    """Toutes les tailles du logo, à partir de l'image choisie dans Pages CMS (affichée dans un rond)."""
    contact = RACINE / "contenu" / "contact.json"
    chemin = str((json.loads(contact.read_text(encoding="utf-8")) if contact.exists() else {}).get("logo") or "").lstrip("/")
    if not chemin:
        print("Logo : celui d'origine est conservé (aucun logo choisi dans Pages CMS).")
        return
    fichier = RACINE / chemin
    try:
        im = ImageOps.exif_transpose(Image.open(fichier)).convert("RGBA")
    except Exception as e:  # logo introuvable ou illisible : on garde celui d'origine
        print(f"⚠️  Logo « {chemin} » illisible ou introuvable ({e}) : le logo d'origine est conservé.")
        return
    cote = min(im.size)  # carré centré : le logo est affiché dans un rond
    gauche, haut = (im.width - cote) // 2, (im.height - cote) // 2
    im = im.crop((gauche, haut, gauche + cote, haut + cote))
    if cote < 360:
        print(f"⚠️  Logo petit ({cote} px) : il risque d'être flou. Préférez une image d'au moins 720 px de côté.")
    dest = SORTIE / "assets"
    dest.mkdir(parents=True, exist_ok=True)
    for taille in (120, 360, 720):
        im.resize((taille, taille), Image.LANCZOS).save(dest / f"logo-{taille}.webp", "WEBP", quality=90, method=6)
    im.resize((48, 48), Image.LANCZOS).save(dest / "favicon-48.png")
    fond_hex = str(json.loads(contact.read_text(encoding="utf-8")).get("couleurFond") or "").strip()
    couleur_fond = tuple(int(fond_hex[i:i + 2], 16) for i in (1, 3, 5)) if re.fullmatch(r"#[0-9A-Fa-f]{6}", fond_hex) else CREME
    fond = Image.new("RGB", (180, 180), couleur_fond)
    petit = im.resize((180, 180), Image.LANCZOS)
    fond.paste(petit, (0, 0), petit)
    fond.save(dest / "apple-touch-icon.png")
    apercu = Image.new("RGB", (1200, 630), couleur_fond)
    grand = im.resize((480, 480), Image.LANCZOS)
    apercu.paste(grand, (360, 75), grand)
    apercu.save(dest / "og-image.jpg", "JPEG", quality=88)
    print(f"✅ Logo préparé à partir de « {chemin} » ({cote} px).")


if __name__ == "__main__":
    preparer_logo() if MODE_LOGO else main()

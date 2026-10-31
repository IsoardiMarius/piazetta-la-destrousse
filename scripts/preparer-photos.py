"""Prépare les photos du dossier photos/ pour le site.

- redresse les photos prises au téléphone (orientation EXIF) ;
- les met légèrement en valeur, en restant naturel (contraste, couleurs, netteté) ;
- les redimensionne en deux tailles WebP légères ;
- retire les métadonnées (dont la position GPS du téléphone) ;
- écrit la liste dans assets/photos.json, lue par la page d'accueil.

Utilisation : python3 scripts/preparer-photos.py [dossier-de-sortie]
(par défaut, la sortie est le dossier du projet ; en CI, c'est _site).
"""
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
SORTIE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else RACINE
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
LARGEURS = (800, 1600)
MAX_PHOTOS = 12


def slug(texte):
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "photo"


def legende(nom):
    """« 1-la-reine.jpg » → « La reine » ; « IMG_2034.jpg » → pas de légende."""
    base = re.sub(r"^\d+[\s._-]*", "", Path(nom).stem)
    if re.match(r"^(img|dsc|dcim|pxl|photo|image|wp|screenshot|capture)[\s._-]*\d", base, re.I) or not base:
        return ""
    base = re.sub(r"[_-]+", " ", base).strip()
    return base[:1].upper() + base[1:]


def mettre_en_valeur(im):
    im = ImageOps.autocontrast(im, cutoff=0.4, preserve_tone=True)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    im = ImageEnhance.Color(im).enhance(1.07)
    im = ImageEnhance.Brightness(im).enhance(1.02)
    return im


def main():
    fichiers = sorted(
        (f for f in SOURCE.iterdir() if f.suffix.lower() in EXTENSIONS),
        key=lambda f: f.name.lower(),
    ) if SOURCE.is_dir() else []
    if len(fichiers) > MAX_PHOTOS:
        print(f"⚠️  {len(fichiers)} photos trouvées : seules les {MAX_PHOTOS} premières sont affichées.")
        fichiers = fichiers[:MAX_PHOTOS]

    dest = SORTIE / "photos-web"
    dest.mkdir(parents=True, exist_ok=True)
    liste, vus = [], set()

    for f in fichiers:
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

        petite, grande = variantes[0], variantes[-1]
        liste.append({
            "src": petite[0],
            "grande": grande[0],
            "srcset": ", ".join(f"{p} {w}w" for p, w, _ in variantes),
            "largeur": grande[1],
            "hauteur": grande[2],
            "legende": legende(f.name),
        })
        if im.width < 1000:
            print(f"⚠️  {f.name} est petite ({im.width} px de large) : elle risque d'être floue. Préférez la photo d'origine.")

    (SORTIE / "assets").mkdir(parents=True, exist_ok=True)
    (SORTIE / "assets" / "photos.json").write_text(json.dumps(liste, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✅ {len(liste)} photo(s) préparée(s).")


if __name__ == "__main__":
    main()

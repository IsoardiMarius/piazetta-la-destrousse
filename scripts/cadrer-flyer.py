"""Règle les cadres du PDF du flyer comme l'attendent les imprimeurs :
- page exacte de 154 × 216 mm, soit le format A5 et 3 mm de fond perdu tout autour
  (le navigateur arrondit la taille de la page au 1/300 de pouce) ;
- « TrimBox » (format fini, là où l'imprimeur coupe) et « BleedBox » (fond perdu) :
  les outils de contrôle des imprimeurs les lisent pour vérifier le fichier.

Utilisation (lancé automatiquement à la publication, après scripts/generer-flyer.mjs) :
  python3 scripts/cadrer-flyer.py <dossier-du-site>/flyer.pdf
"""
import sys

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

MM = 72 / 25.4             # points par millimètre
LARGEUR, HAUTEUR = 148 * MM, 210 * MM
FOND_PERDU = 3 * MM

chemin = sys.argv[1]
pdf = PdfWriter(clone_from=PdfReader(chemin))
page = pdf.pages[0]
# Le flyer est placé à 3 mm du bord gauche et du bord haut de la page générée
gauche, haut = float(page.mediabox.left), float(page.mediabox.top)
page_entiere = RectangleObject([gauche, haut - HAUTEUR - 2 * FOND_PERDU, gauche + LARGEUR + 2 * FOND_PERDU, haut])
format_fini = RectangleObject([gauche + FOND_PERDU, haut - FOND_PERDU - HAUTEUR, gauche + FOND_PERDU + LARGEUR, haut - FOND_PERDU])
page.mediabox = page_entiere
page.cropbox = page_entiere
page.bleedbox = page_entiere
page.trimbox = format_fini
pdf.write(chemin)
print("✅ Flyer : page de 154 × 216 mm, format fini A5 indiqué à l'imprimeur (TrimBox).")

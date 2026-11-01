"""QR code du flyer : il mène à la carte du site (assets/qr-carte.svg, image vectorielle,
nette à toutes les tailles d'impression).

Utilisation (lancé automatiquement à la publication) :
  python3 scripts/generer-qr.py <dossier-du-site> <adresse-du-site>
"""
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg

if len(sys.argv) < 3 or not sys.argv[2].strip():
    sys.exit("❌ Utilisation : python3 scripts/generer-qr.py <dossier-du-site> <adresse-du-site>")

dossier = Path(sys.argv[1]).resolve()
url = sys.argv[2].strip().rstrip("/") + "/carte.html"

# Correction d'erreur moyenne (lisible même un peu abîmé) et marge blanche de 4 modules, comme le demande la norme
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=4, image_factory=qrcode.image.svg.SvgPathImage)
qr.add_data(url)
qr.make(fit=True)
(dossier / "assets").mkdir(parents=True, exist_ok=True)
qr.make_image().save(str(dossier / "assets" / "qr-carte.svg"))
print(f"✅ QR code du flyer généré : {url}")

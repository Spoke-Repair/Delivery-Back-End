import os
import json

# Store firebase credentials into json

firebase_credentials = {
  "type": "service_account",
  "project_id": "spoke-ops-tool",
  "private_key_id": "065e9681e3928b7f1103ac7a5f9ee94eb3285f5a",
  "client_email": "firebase-adminsdk-hj3b2@spoke-ops-tool.iam.gserviceaccount.com",
  "client_id": "107771288516978348519",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hj3b2%40spoke-ops-tool.iam.gserviceaccount.com"
}

def load_firebase_credentials_into_json():
	credentials = {}

	firebase_private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
	firebase_credentials['private_key'] = firebase_private_key.replace('\\n', '\n')

	with open(os.path.expanduser('firebase-service-acc-creds.json'), 'w', encoding="utf-8") as jsonfile:
		jsonfile.write(json.dumps(firebase_credentials, indent="\t"))
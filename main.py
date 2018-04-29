# [START app]

import logging

# [START imports]
from flask import Flask, render_template, request, session, send_from_directory
import requests
import os
import json
from twilio.rest import Client
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from authenticate import load_firebase_credentials_into_json
from datetime import datetime

from flask import jsonify
# [END imports]

# [START create_app]
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY')

# stored in private credentials file that isn't uploaded to repo.
# For information on how heroku stores it, see
# https://softwareengineering.stackexchange.com/questions/163506/how-does-one-handle-sensitive-data-when-using-github-and-heroku
twilio_sid, twilio_auth_token = os.environ.get('TWILIO_SID'), os.environ.get('TWILIO_AUTH_TOKEN')
twilioClient = Client(twilio_sid, twilio_auth_token)

load_firebase_credentials_into_json()
cred = credentials.Certificate('firebase-service-acc-creds.json')
firebase_admin.initialize_app(cred, {'databaseURL': 'https://spoke-ops-tool.firebaseio.com/'})

fb_globals_ref = db.reference('globals').get()
twilio_to_number, twilio_from_number = fb_globals_ref['twilio_to_number'], fb_globals_ref['twilio_from_number']
sh_key = fb_globals_ref['typeform_response_sheet_id']

# [END create_app]

# for documentation on setting up pygsheets:
# https://github.com/nithinmurali/pygsheets
import pygsheets
gc = pygsheets.authorize(outh_nonlocal=True, outh_file="sheets.googleapis.com-python.json", no_cache=True)
sh = gc.open_by_key(sh_key)

# TODO: store these in a database rather than keeping track of all shops via hardcoded list of them.
wksheets = {'WLC': sh.worksheet_by_title('Spoke Delivery (Waterloo)')}
shopNames = {'WLC': 'Waterloo Cycles'}

# initialize data
cells = {'WLC': wksheets['WLC'].range('A2:L100', returnas="range")}

# possible values for "shop" values in /complete
shops = ['']

@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'landing_page_assets/index.html')

@app.route('/customer-data')
def customerData():
    shopCells = cells[session['shop']]
    # cell.fetch() was already called to update the DataRange in /complete.
    # but now they have to be formatted to send to the frontend.
    entries = []

    # grab the last row number from the range string. i.e. A1:J100 --> 100
    # subtract header rows.
    length = int(shopCells.range.split(':')[1][1:]) - 2
    for idx in range(length):
        row = shopCells[idx]
        if not row[0].value:
            continue
        curCustomer = {'name': row[0].value + ' ' + row[1].value, \
                        'completed': row[9].value, \
                        'eta_date': row[8].value, \
                        'price': row[10].value, \
                        'repair_summary': row[11].value, \
                        'row_number': idx + 2}
        entries.append(curCustomer)
    return jsonify(entries)

@app.route('/change-customer', methods=['POST'])
def changeDate():
    shopWks = wksheets[session['shop']]
    data = request.get_json()

    # update the date for the correct cell. Column name is I for date
    for field, colLetter in {'date': 'I', 'price': 'K', 'repairSummary': 'L'}.items():
        if field in data.keys():
            cellAddr = colLetter + str(data['key'])
            shopWks.update_cell(cellAddr, str(data[field]))
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/send-completion', methods=['POST'])
def sendCompletion():
    shopWks = wksheets[session['shop']]
    data = request.get_json()

    # update the completed status for the correct cell. Column name is J for completion
    shopWks.update_cell('J' + str(data['key']), True)

    smsBody = shopNames[session['shop']] + ' completed a repair for ' + data['name']
    twilioClient.api.account.messages.create(
        to=twilio_to_number,
        from_=twilio_from_number,
        body=smsBody)

    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/complete')
def complete():
    session['shop'] = request.args.get('shop')

    # reload the data when the page is refreshed
    cells[session['shop']].fetch()
    return render_template('repair_complete.html', shopName=shopNames[session['shop']])

@app.route('/get-orders')
def pushUserData():
    work_orders = db.reference('workOrders').order_by_child('shop_key').equal_to(session['shop']).get()
    work_orders_list = []
    for _, val in work_orders.items():
        work_orders_list.append(val)
    return jsonify(work_orders_list)

@app.route('/new-work-order', methods=["POST"])
def newWorkOrder():
    orderData = request.get_json()
    order = db.reference('workOrders').push()
    order.set({
        'shop_key': session['shop'],
        'customer_name': orderData['customer_name'],
        'customer_phone': orderData['customer_phone'],
        'repair_summary': orderData['repair_summary'],
        'completed': False,
        'creation_date': str(datetime.now())
        })
    return 'ok'

@app.route('/wakemydyno.txt')
def wakemydyno():
    return send_from_directory(app.static_folder, request.path[1:])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
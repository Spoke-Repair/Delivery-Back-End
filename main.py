# [START app]

import logging

# dummy change
# [START imports]
from flask import Flask, render_template, request, session, send_from_directory
import requests
import os
import json
from twilio.rest import Client

from flask import jsonify
# [END imports]

# [START create_app]
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') or \
    'e5ac358c-f0bf-11e5-9e39-d3b532c10a28'

# stored in private credentials file that isn't uploaded to repo.
# For information on how heroku stores it, see
# https://softwareengineering.stackexchange.com/questions/163506/how-does-one-handle-sensitive-data-when-using-github-and-heroku
twilio_sid, twilio_auth_token = os.environ.get('TWILIO_SID'), os.environ.get('TWILIO_AUTH_TOKEN')
twilioClient = Client(twilio_sid, twilio_auth_token)

# [END create_app]

# for documentation on setting up pygsheets:
# https://github.com/nithinmurali/pygsheets
import pygsheets
gc = pygsheets.authorize(outh_nonlocal=True, outh_file="sheets.googleapis.com-python.json", no_cache=True)
sh = gc.open_by_key('1H1M2lmPzEzVISCp5PsK98UZCuuoTSeL1rthw8wHeZME')

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
    for idx, row in enumerate(shopCells):
        if not row[0].value:
            break
        curCustomer = {'name': row[0].value + ' ' + row[1].value, \
                        'completed': row[9].value, \
                        'eta_date': row[8].value, \
                        'price': row[10].value, \
                        'row_number': idx + 2}
        entries.append(curCustomer)
    return jsonify(entries)

@app.route('/change-customer', methods=['POST'])
def changeDate():
    shopWks = wksheets[session['shop']]
    data = request.get_json()

    # update the date for the correct cell. Column name is I for date
    for field, colLetter in {'date': 'I', 'price': 'K'}.items():
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
        to="+12104833330",
        from_="+18316618982",
        body=smsBody)

    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/complete')
def complete():
    session['shop'] = request.args.get('shop')

    # reload the data when the page is refreshed
    cells[session['shop']].fetch()
    return render_template('repair_complete.html', shopName=shopNames[session['shop']])

@app.route('/wakemydyno.txt')
def wakemydyno():
    return send_from_directory(app.static_folder, request.path[1:])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
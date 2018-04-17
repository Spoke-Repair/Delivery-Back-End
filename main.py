# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Flask on GAE tutorial: https://cloud.google.com/appengine/docs/standard/python/getting-started/python-standard-env

# [START app]

import logging

# [START imports]
from flask import Flask, render_template, request, session, send_from_directory
import requests
import os
from requests_toolbelt.adapters import appengine
import json
appengine.monkeypatch()

from flask import jsonify
# [END imports]

# [START create_app]
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') or \
    'e5ac358c-f0bf-11e5-9e39-d3b532c10a28'
# [END create_app]

# for documentation on setting up pygsheets:
# https://github.com/nithinmurali/pygsheets
import pygsheets
gc = pygsheets.authorize(outh_nonlocal=True, outh_file="sheets.googleapis.com-python.json", no_cache=True)
sh = gc.open_by_key('1H1M2lmPzEzVISCp5PsK98UZCuuoTSeL1rthw8wHeZME')

# TODO: store these in a database rather than keeping track of all shops via hardcoded list of them.
wksheets = {'WLC': sh.worksheet_by_title('Spoke Delivery (Waterloo)')}

# initialize data
cells = {'WLC': wksheets['WLC'].range('A2:J100', returnas="range")}

# possible values for "shop" values in /complete
shops = ['']

@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]

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
                        'row_number': idx + 2}
        entries.append(curCustomer)
    return jsonify(entries)

@app.route('/change-date', methods=['POST'])
def changeDate():
    shopWks = wksheets[session['shop']]
    data = request.get_json()

    # update the date for the correct cell. Column name is I for date
    shopWks.update_cell('I' + str(data['key']), str(data['date']))
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/send-completion', methods=['POST'])
def sendCompletion():
    shopWks = wksheets[session['shop']]
    data = request.get_json()

    # update the completed status for the correct cell. Column name is J for completion
    shopWks.update_cell('J' + str(data['key']), str(data['completed']))
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

@app.route('/complete')
def complete():
    session['shop'] = request.args.get('shop')

    # reload the data when the page is refreshed
    cells[session['shop']].fetch()
    return render_template('repair_complete.html')

@app.route('/wakemydyno.txt')
def wakemydyno():
    return send_from_directory(app.static_folder, request.path[1:])
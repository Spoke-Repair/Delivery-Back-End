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

# [START app]

import logging

# [START imports]
from flask import Flask, render_template, request
import requests
from requests_toolbelt.adapters import appengine
appengine.monkeypatch()

from flask import jsonify
# [END imports]

# [START create_app]
app = Flask(__name__)
# [END create_app]

import pygsheets
gc = pygsheets.authorize(outh_nonlocal=True, outh_file="sheets.googleapis.com-python.json", no_cache=True)
sh = gc.open_by_key('1M442BGZL1WA2o1Te_pBFQKZc1p06WEAxEUUvIM3dRz8')


# [START form]
@app.route('/form')
def form():
    return render_template('form.html')
# [END form]

# [START submitted]
@app.route('/submitted', methods=['POST'])
def submitted_form():
    name = request.form['name']
    email = request.form['email']
    site = request.form['site_url']
    comments = request.form['comments']

    # [END submitted]
    # [START render_template]
    return render_template(
        'submitted_form.html',
        name=name,
        email=email,
        site=site,
        comments=comments)
    # [END render_template]


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
# [END app]

@app.route('/customer-data')
def customerData():
    # Open spreadsheet and then workseet
    wks = sh.worksheet_by_title('Apps Script Data')
    cell_list = wks.range('A2:I40', returnas="matrix")

    entries = []
    for row in cell_list:
        name = row[0].encode('utf-8')
        if not name:
            break
        entries.append([x.encode('utf-8') for x in row])

    return jsonify(entries)

@app.route('/deliver')
def deliver():
    return render_template('deliver.html')
    # print(cell_list)

    # Update a cell with value (just to let him know values is updated ;) )
    # wks.update_cell('A1', "Hey yank this numpy array")

    # update the sheet with array
    # wks.update_cells('A2', my_nparray.to_list())

    # share the sheet with your friend
    # sh.share("myFriend@gmail.com")
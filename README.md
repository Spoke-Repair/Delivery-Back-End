## To start

Authenticate on google:
```
$ python gsheets_auth.py
```

Run the flask server:

```
python main.py
```

## Notes on setup:

This app works with credentials that were set in environment variables locally. There's a file called `credentials` in root on local machine that exports environment variables, i.e. `export CREDENTIAL_KEY_NAME=VALUE` lines. So to test locally (right now it needs two keys: `TWILIO_SID` and `TWILIO_AUTH_TOKEN`), create that file and add those lines. Then, run `source credentials` to load the environment variables. To store credentials on Heroku, it's possible to set its environment variables remotely.

1. Install heroku CLI
2. run `heroku config:add CREDENTIAL_KEY_NAME=CREDENTIAL_KEY_VALUE CRED2=CRED_VALUE_2 ...` (as many keys and values as are in `credentials` file locally stored.
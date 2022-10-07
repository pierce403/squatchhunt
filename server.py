import flask
from flask import render_template, request, Flask, g, send_from_directory, abort, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, Float, Integer, String, MetaData, ForeignKey

import json
import random
import string
import os
import time

from web3.auto import w3
from eth_account.messages import defunct_hash_message

from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, set_access_cookies

from ethhelper import *

app = Flask(__name__,static_url_path='/static')
app.jinja_env.add_extension('jinja2.ext.do')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

# Setup the Flask-JWT-Extended extension
# log2(26^22) ~= 100 (pull at least 100 bits of entropy)
app.config['JWT_SECRET_KEY'] = 'POTATO'
#app.config['JWT_SECRET_KEY'] = ''.join(random.choice(string.ascii_lowercase) for i in range(22))
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = True
#app.config['JWT_ACCESS_COOKIE_PATH'] = '/api/'
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
jwt = JWTManager(app)

@app.before_first_request
def setup():
  print("[+] running setup")
  try:
    db.create_all()
    print("[+] created users db")
  except:
    print("[+] users db already exists")

def generate_nonce(self, length=8):
  return ''.join([str(randint(0, 9)) for i in range(length)])

class User(db.Model):
  public_address = db.Column(db.String(80), primary_key=True, nullable=False, unique=True)
  nonce = db.Column(db.Integer(),nullable=False,default=generate_nonce,)

@app.route('/')
def landing():
  return render_template("index.html")

@app.route('/freematic')
def free_matic():
  return render_template("free_matic.html")

@app.route('/faucet')
def faucet():
  return render_template("faucet.html")

@app.route('/casino')
def casino():
  return render_template("casino.html")

@app.route('/squatches')
def squatches():
  return render_template("squatches.html")

@app.route('/lounge')
@jwt_required()
def secret():
  current_user = get_jwt_identity()
  numtokens = tokencount(current_user)

  # FLAG 200
  if numtokens > 1:
    msg="<br><br>FLAG 200: "+os.environ['FLAG200']
  else:
    return("Hey, do you even have any SQUATCH tokens?<br>Maybe try the <a href='https://squatchhunt.com/faucet'>faucet</a>.")

  # FLAG 300
  if numtokens > 100:
    msg=msg+"<br>FLAG 300: "+os.environ['FLAG300']
  else:
    msg=msg+"<br><br>That's a good start, but you've got to pump up those rookie numbers.<br>Next flag when you have over 100 tokens. There exist shortcuts. See if you can find the source code for the contract, that should help find any potential weaknesses."
    return ("HELLO "+str(current_user)+"<br><br>"+msg)

  # FLAG 400
  if numtokens > 100000:
    msg=msg+"<br>FLAG 400: "+os.environ['FLAG400']
  else:
    msg=msg+"<br><br>Still low on tokens? Try hitting up /casino."

  return ("HELLO "+str(current_user)+" "+msg)


@app.route('/squatch_club')
@jwt_required()
def squatch_check():
  current_user = get_jwt_identity()
  #numtokens = tokencount(current_user)
  if squatch_club(current_user):
    msg = "Nice Squatch you got there  FLAG 500: "+os.environ['FLAG500']
  else:
    msg = "no squatches!"
  return(msg)


@app.route('/login', methods=['POST'])
def login():

    print("[+] creating session")

    print("info: "+(str(request.json)))

    public_address = request.json[0]
    signature = request.json[1]

    domain = "squatchhunt.com"

    rightnow = int(time.time())
    sortanow = rightnow-rightnow%600
    print("[*] sortanow is "+str(sortanow))
   
    original_message = 'Signing in to {} at {}'.format(domain,sortanow)
    print("[+] checking: "+original_message)
    message_hash = defunct_hash_message(text=original_message)
    signer = w3.eth.account.recoverHash(message_hash, signature=signature)
    print("[+] fascinating")

    if signer == public_address:
      print("[+] this is fine "+str(signer))
       # account.nonce = account.generate_nonce()
       # db.session.commit()
    else:
      print("[-] oops, not legit '"+signer+"' != '"+public_address+"'")
      return jsonify({'login': False})

    print("[+] OMG looks good")

    access_token = create_access_token(identity=public_address)

    resp = jsonify({'login': True})
    set_access_cookies(resp, access_token)
    return resp, 200

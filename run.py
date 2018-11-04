# -*- coding: utf-8 -*-

from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    menu = render_template("menu.html")
    return render_template("index.html", menu = menu)

if __name__ == "__main__":
    port = 8888
    app.debug = True
    app.run(host = "localhost", port = port)

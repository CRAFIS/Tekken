FROM python:3.6

RUN apk update
RUN apk add git

RUN git clone https://github.com/CRAFIS/Tekken.git
RUN pip install -r /Tekken/requirements.txt

ENV FLASK_APP /Tekken/run.py
CMD flask run -h 0.0.0.0 -p $PORT

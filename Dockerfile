FROM python:3.6

RUN apt update
RUN apt install git

RUN git clone https://github.com/KeyTey/Kakugame.git
RUN pip install --upgrade pip
RUN pip install -r /Kakugame/requirements.txt

WORKDIR /Kakugame
CMD gunicorn -b 0.0.0.0:$PORT run:app --log-file=-

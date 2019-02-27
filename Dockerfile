FROM python:3.6

RUN apt update
RUN apt install git

RUN git clone https://github.com/CRAFIS/Tekken.git
RUN pip install -r /Tekken/requirements.txt

WORKDIR /Tekken
CMD gunicorn run:app

FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt
RUN pip config set global.extra-index-url "https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple"

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app

EXPOSE 3080

CMD ["fastapi", "run", "app/main.py", "--port", "3080", "--proxy-headers"]

#CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3080", "--workers", "4"]

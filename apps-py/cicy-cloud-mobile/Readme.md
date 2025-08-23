    uv init --app
    uv add fastapi --extra standard
    uv run fastapi dev

    sudo docker build -t fastapi-app .
    sudo docker run -p 8000:80 fastapi-app
    sudo docker ps
    

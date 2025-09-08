ffmpeg -i dog.mp4 -movflags faststart -c copy dog_preview.mp4

ffmpeg -i input.mp4 -t 3 -c copy ../preview/input_preview.mp4

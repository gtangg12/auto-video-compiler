from flask import Flask, send_file, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/video')
def serve_video():
    return send_file('video.mp4', mimetype='video/mp4')

@app.route('/list-videos')
def list_videos():
    video_dir = os.path.expanduser('../../videos')
    video_files = os.listdir(video_dir)
    print("video_files: ",video_files)
    return jsonify(video_files)

if __name__ == '__main__':
    app.run(debug=True)

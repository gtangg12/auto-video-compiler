from flask import Flask, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/video')
def serve_video():
    return send_file('video.mp4', mimetype='video/mp4')

if __name__ == '__main__':
    app.run(debug=True)

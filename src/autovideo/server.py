import os
import time
import random
from pathlib import Path

from flask import Flask, send_file, jsonify, request
from flask_cors import CORS, cross_origin
from glob import glob

from autovideo.data.loaders import concat
from autovideo.search import SearchEngine
from autovideo.summarize import SummaryEngine
from autovideo.bgm import add_bgm_to_video

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

engine = SearchEngine("assets/data", topk=3)
engine_summarize = SummaryEngine()

@app.route('/video/<name>')
def serve_video(name):
    response = send_file(f'assets/data/{name}', mimetype='video/mp4')
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/list-videos')
def list_videos():
    return jsonify(list(glob.glob('assets/data/*')))

@app.route('/list-videos-trending')
def list_videos_trending():
    return jsonify(list(glob.glob('assets/data-reference/*')))

def search_text(text: str) -> list[Path | str]:
    return engine.search_text(text)

def search_video(path: Path | str) -> list[Path | str]:
    return engine.search_video(path)

def concat_videos(paths: list[Path | str], output_path: str):
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    concat(paths, output_path)

def add_bgm(path: Path | str):
    output = f'assets/data-generated/{time.time()}.mp4'
    bgms = glob('assets/bgm/*')
    bgm_path = bgms[random.randint(0, len(bgms) - 1)]
    add_bgm_to_video(path, bgm_path, output)
    return output

def summarize(path: Path | str):
    return engine_summarize.summarize(path)


current_video = None


@app.route('/create_video', methods=['POST'])
def create_videos():
    global current_video
    print("received request")
    data = request.get_json()
    print("data: ", data)
    text = data.get('data', 'No text provided')
    print("Received text:", text)
    
    # Ensure the assets directory exists
    assets_dir = os.path.join(os.path.dirname(__file__), '../../assets')
    data_dir = os.path.join(assets_dir, 'data')
    generated_dir = os.path.join(assets_dir, 'data-generated')
    
    for directory in [assets_dir, data_dir, generated_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory)

    if "create" in text:
        if "viral_recommendations" in text:
            video_files = search_video("assets/data-reference/IMG_2528.mp4")
            print("video_files from search_video: ", video_files)
        else:
            video_files = search_text(" ".join(text.split(" ")[1:]))
            print("video_files from search_text: ", video_files)
    elif "bgm" in text:
        video_files = [add_bgm(current_video)]
    # elif "evaluate" in text:
    #     summarize(current_video)
    #     # return text
    else:
        # Default to using all videos in the data directory if no specific search
        video_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith('.mp4')]

    if not video_files:
        return jsonify({
            "error": "No videos found matching the criteria",
            "message": "No videos found matching the criteria"
        }), 404

    print("video_files: ", video_files)
    
    # Ensure output path has .mp4 extension
    timestamp = str(time.time()).replace('.', '_')
    output_filename = f'output_{timestamp}.mp4'
    current_video = f"assets/data-generated/{output_filename}"
    concatenated_video_path = os.path.join(generated_dir, output_filename)
    
    try:
        # Concatenate the videos and get the output path
        concat_videos(video_files, concatenated_video_path)
        
        # Send the video file directly with appropriate headers
        response = send_file(
            concatenated_video_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name=output_filename
        )
        
        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        
        return response
        
    except Exception as e:
        print(f"Error creating video: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Failed to create video"
        }), 500


if __name__ == '__main__':
    app.run(debug=True)
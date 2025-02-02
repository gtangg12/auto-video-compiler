import os
import time
import random
from pathlib import Path

from flask import Flask, send_file, jsonify, request
from flask_cors import CORS
from glob import glob

from autovideo.data.loaders import concat
from autovideo.search import SearchEngine
from autovideo.bgm import add_looping_music


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


engine = SearchEngine("assets/data", topk=5)


@app.route('/video')
def serve_video(name):
    return send_file(f'assets/data/{name}', mimetype='video/mp4')


@app.route('/list-videos')
def list_videos():
    return jsonify(list(glob.glob('assets/data/*')))


@app.route('/list-videos-trending')
def list_videos_trending():
    return jsonify(list(glob.glob('assets/data-reference/*')))


def search_text(text: str) -> list[Path | str]:
    engine.search_text(text)


def search_video(path: Path | str) -> list[Path | str]:
    engine.search_video(path)


def concat_videos(paths: list[Path | str]) -> Path | str:
    output = f'assets/data-generated/{time.time()}'
    concat(paths, output)
    return output


def add_bgm(path: str):
    output = f'assets/data-generated/{time.time()}'
    bgms = glob.glob('assets/bgm')
    bgm_path = bgms[random.randint(0, len(bgms))]
    add_looping_music(path, bgm_path, output)
    return output


def llm_audio():
    pass


if __name__ == '__main__':
    app.run(debug=True)
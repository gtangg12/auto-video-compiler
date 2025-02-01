import subprocess
import os


def add_bgm_to_video(video_path, bgm_path, output_path):
    """
    Replaces any existing audio in `video_path` with
    background music from `bgm_path`, looping as needed
    to match video duration.
    """
    # --- 1. Get the video duration ---
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    try:
        video_duration = float(subprocess.check_output(probe_cmd).decode().strip())
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to get video duration: {e}")

    # --- 2. Loop the BGM to match video duration ---
    temp_audio = "temp_looped_bgm.m4a"
    loop_cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "9999",  # Repeat many times so it exceeds video_duration
        "-i", bgm_path,
        "-t", str(video_duration),   # Then trim to exactly the video duration
        "-c:a", "aac", "-b:a", "192k",
        temp_audio
    ]
    subprocess.run(loop_cmd, check=True)

    # --- 3. Merge: map only the video from the first input (0:v:0)
    #              and only the audio from the second input (1:a:0).
    #     This *replaces* any original audio track with the new BGM.
    merge_cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", temp_audio,
        # Explicit mapping:
        "-map", "0:v:0",   # take the video track from input 0 (the original video)
        "-map", "1:a:0",   # take the audio track from input 1 (our looped BGM)
        "-c:v", "copy",    # don't re-encode the video
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",       # end when the shortest stream ends (the video)
        output_path
    ]
    subprocess.run(merge_cmd, check=True)

    # --- 4. Clean up temporary audio ---
    if os.path.exists(temp_audio):
        os.remove(temp_audio)

    print(f"Successfully added BGM. Output: {output_path}")


if __name__ == '__main__':
    add_bgm_to_video("assets/data/IMG_1484.mp4", "assets/bgm/lazy-day-stylish-futuristic-chill-239287.mp3", "tmp.mp4")
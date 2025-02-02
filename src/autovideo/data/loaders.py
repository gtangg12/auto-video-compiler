import os
import subprocess
from pathlib import Path

import cv2


def read(path: Path | str):
    """
    Read video frames from a .mp4 file using OpenCV and yield them one by one.
    
    Args:
        path (Path | str): Path to the .mp4 file.

    Yields:
        numpy.ndarray: The next frame from the video in BGR format.
    
    Raises:
        FileNotFoundError: If the file cannot be opened by OpenCV (e.g., path does not exist).
    
    Example:
        >>> for frame in read("example.mp4"):
        ...     # Process each frame here
        ...     pass
    """
    path = str(path)

    cap = cv2.VideoCapture(path)

    if not cap.isOpened():
        raise FileNotFoundError(f"Cannot open video file: {path}")

    try:
        while True:
            # Read one frame
            ret, frame = cap.read()
            if not ret:  # No more frames or error
                break
            yield frame
    finally:
        cap.release()


import subprocess
from pathlib import Path

def concat(paths: list[Path | str],
                       output: Path | str,
                       target_fps: int = 30,
                       target_resolution: str = "2160x3840"):
    """
    Concatenates multiple videos using the FFmpeg concat filter,
    enforcing a consistent frame rate and resolution.

    Args:
        paths (list[Path | str]): List of video file paths to concatenate.
        output (Path | str): Output concatenated video file.
        target_fps (int): Desired frames per second for the output video.
        target_resolution (str): Target resolution as 'WIDTHxHEIGHT' (e.g., '2160x3840').
                                 Each input video will be scaled to this resolution.

    Returns:
        None
    """
    # Convert all paths to strings.
    paths = [str(p) for p in paths]

    # Build the basic ffmpeg command with inputs.
    cmd = ["ffmpeg"]
    for path in paths:
        cmd.extend(["-i", path])
    
    n = len(paths)
    filter_parts = []
    
    # Parse the target resolution outside the loop.
    try:
        width, height = target_resolution.split('x')
    except ValueError:
        raise ValueError("target_resolution must be in the format 'WIDTHxHEIGHT', e.g., '2160x3840'.")
    
    # Process each input.
    for i in range(n):
        # Force each video through the scale filter and reset timing.
        # force_original_aspect_ratio=disable ensures the scale filter always outputs the desired dimensions.
        filter_parts.append(
            f"[{i}:v]scale={width}:{height}:force_original_aspect_ratio=disable,setsar=1,setpts=PTS-STARTPTS,fps={target_fps}[v{i}];"
        )
        filter_parts.append(
            f"[{i}:a]aresample=async=1[a{i}];"
        )
    
    # Build interleaved stream labels: [v0][a0][v1][a1]...
    interleaved = "".join(f"[v{i}][a{i}]" for i in range(n))
    # Concatenate all streams (note: streams must be interleaved in video-audio pairs).
    filter_parts.append(
        f"{interleaved}concat=n={n}:v=1:a=1[v][a]"
    )
    
    # Join all filter parts into one filter_complex string.
    filter_complex = "".join(filter_parts)
    
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-r", str(target_fps),
        str(output)
    ])
    
    subprocess.run(cmd, check=True)
    print(f"Concatenated video saved to: {output}")


if __name__ == '__main__':
    #for i, frame in enumerate(read("assets/sample.mp4")):
    #    print(i)
    concat(['assets/data/IMG_1484.mp4', 'assets/data/IMG_3964.mp4', 'assets/data/IMG_1928.mp4', 'assets/data/IMG_8970.mp4', 'assets/data/IMG_4212.mp4'], "assets/sample_concat.mp4")
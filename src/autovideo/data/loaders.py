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


def concat(paths: list[Path | str], output: Path | str):
    """
    Concatenates multiple MP4 videos using FFmpeg without re-encoding.

    Args:
        paths (list[Path | str]): List of video file paths to concatenate.
        output (Path | str): Output concatenated video file.

    Returns:
        None
    """
    paths = [str(path) for path in paths]

    # Create a temporary list file for ffmpeg
    list_file = "concat_list.txt"
    with open(list_file, "w") as f:
        for path in paths:
            f.write(f"file '{path}'\n")

    # Run FFmpeg to concatenate the videos
    ffmpeg_command = [
        "ffmpeg", "-f", "concat", "-safe", "0", "-i", list_file,
        "-c", "copy", str(output)
    ]
    subprocess.run(ffmpeg_command, check=True)

    # Remove temporary file
    os.remove(list_file)

    print(f"Concatenated video saved to: {output}")


if __name__ == '__main__':
    #for i, frame in enumerate(read("assets/sample.mp4")):
    #    print(i)
    
    concat(["assets/sample.mp4", "assets/sample.mp4"], "assets/sample_concat.mp4")
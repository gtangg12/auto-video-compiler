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
    

if __name__ == '__main__':
    for i, frame in enumerate(read("assets/sample.mp4")):
        print(i)
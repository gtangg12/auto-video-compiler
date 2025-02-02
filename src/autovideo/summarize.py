from pathlib import Path
from PIL import Image

from autovideo.data.loaders import read
from autovideo.models.gpt import ModelGpt, ModelGptInput, unpack_content


PROMPT = """You are to analyze a set of images sampled from a viral video. Specifically, describe why

1) The video went viral.
2) What is the hook of the video.
3) How can future content and non content creators minmic this content.
"""


class SummaryEngine():
    """
    """
    def __init__(self):
        self.model = ModelGpt(model='gpt-4o')

    def summarize(self, path: Path | str, stride=30):
        """
        """
        input = ModelGptInput()
        input.append(PROMPT)
        count = 0
        for i, frame in enumerate(read(path)):
            if i % stride:
                continue
            input.append(Image.fromarray(frame))
            count += 1
            if count > 3:
                break
        return unpack_content(self.model(input))
    

if __name__ == '__main__':
    engine = SummaryEngine()
    print(engine.summarize("assets/data-reference/sample.mp4"))

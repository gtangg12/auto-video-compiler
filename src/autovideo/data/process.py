import pickle
from pathlib import Path
from glob import glob

import torch
from omegaconf import OmegaConf

from autovideo.data.loaders import *
from autovideo.models.clip import ModelClip
from autovideo.models.gpt import ModelGpt, ModelGptInput


def compute_embed(path: Path | str, model: ModelClip, stride=10) -> torch.Tensor:
    """
    """
    embed = []
    count = 0
    for frame in read(path)[::stride]:
        embed.append(model.encode_image(frame))
        count += 1
    return torch.stack(embed) / count


def process(path: Path | str, extension="mp4", stride=10) -> dict:
    """
    """
    clip = ModelClip(OmegaConf.create({'name': 'ViT-B/32', 'temperature': 0.1}))

    outputs = {}
    filenames = Path(path).glob(f"*.{extension}")
    for filename in filenames:
        outputs[filename] = compute_embed(text, filename, model, stride=stride)
    return outputs


if __name__ == '__main__':
    process("assets")
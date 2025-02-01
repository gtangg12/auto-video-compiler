import pickle
from pathlib import Path
from glob import glob

import torch
from torchvision.transforms.functional import to_tensor
from omegaconf import OmegaConf

from autovideo.data.loaders import *
from autovideo.models.clip import ModelClip
from autovideo.models.gpt import ModelGpt, ModelGptInput


def compute_embed(path: Path | str, model: ModelClip, stride=10) -> torch.Tensor:
    """
    """
    embed = []
    for i, frame in enumerate(read(path)):
        if i % stride:
            continue
        embed.append(model.encode_image(to_tensor(frame).unsqueeze(0))[0])
    return torch.stack(embed).mean(0)


def process(path: Path | str, extension="mp4", stride=10) -> dict:
    """
    """
    model = ModelClip(OmegaConf.create({'name': 'ViT-B/16', 'temperature': 0.1}))

    outputs = {}
    filenames = glob(f"{path}/*.{extension}")
    for filename in filenames:
        print(filename)
        outputs[filename] = compute_embed(filename, model, stride=stride)
    return outputs


if __name__ == '__main__':
    path = Path("assets/data")
    outputs = process(path)
    with open(path / "embeds.pkl", "wb") as f:
        pickle.dump(outputs, f)
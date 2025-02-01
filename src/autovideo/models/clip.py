import numpy as np
import clip
import torch
import torch.nn.functional as F
from torchvision import transforms
from torchvision.transforms.functional import to_tensor
from PIL import Image
from omegaconf import OmegaConf
from torchvision import transforms


DEFAULT_NEGATIVES = ['object', 'things', 'stuff', 'texture']


def norm(x: torch.Tensor) -> torch.Tensor:
    """
    """
    return x / x.norm(dim=-1, keepdim=True)


def transforms_imagenet(resize: tuple[int, int]=None, interpolation=transforms.InterpolationMode.BICUBIC):
    """
    Returns transform that resizes and normalizes an image with ImageNet mean and std.
    """
    return transforms.Compose(
        [
            transforms.Resize(resize, interpolation=interpolation) if resize else lambda x: x,
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std =[0.229, 0.224, 0.225],
            ),
        ]
    )


class ModelClip:
    """
    """
    EMBEDDING_DIM = 512

    def __init__(self, config: OmegaConf, device='cpu'):
        """
        """
        self.config = config
        self.device = device
        self.model, _ = clip.load(config.name)
        self.transform = transforms_imagenet(resize=(224, 224))
    
    def __call__(self, image: np.ndarray, text: str, negatives: list[str] = DEFAULT_NEGATIVES) -> float:
        """
        Return similarity score between image and text.
        """
        image_embeddings = self.encode_image(to_tensor(image).unsqueeze(0))

        positive_embeddings = self.encode_text(text)
        negative_embeddings = self.encode_text(negatives)
        positive_similarity = image_embeddings @ positive_embeddings.T
        negative_similarity = image_embeddings @ negative_embeddings.T
        probs = F.softmax(torch.cat([
            positive_similarity / self.config.temperature, 
            negative_similarity / self.config.temperature,
        ], dim=1), dim=1)
        return probs[0, 0].item()

    def encode_image(self, image: torch.Tensor) -> torch.Tensor:
        """
        """
        image = self.transform(image).to(self.device)
        with torch.no_grad():
            embedding = self.model.encode_image(image)
        return norm(embedding)

    def encode_text(self, text: str | list[str]) -> torch.Tensor:
        """
        """
        if isinstance(text, str):
            text = [text]
        tokens = clip.tokenize(text).to(self.device)
        with torch.no_grad():
            embedding = self.model.encode_text(tokens)
        return norm(embedding)


if __name__ == '__main__':
    model = ModelClip(OmegaConf.create({'name': 'ViT-B/16', 'temperature': 0.1}))
    image = Image.open('assets/sample.jpeg')
    image = np.array(image)
    print(model(image, 'cat'))
    print(model(image, 'dog'))
    print(model(image, 'tent'))
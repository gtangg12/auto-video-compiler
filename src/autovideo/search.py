import pickle
from pathlib import Path

import torch

from autovideo.data.process import compute_embed
from autovideo.models.clip import ModelClip


class SearchEngine:
    """
    """
    def __init__(self, path: Path | str, topk=5):
        """
        """
        self.model = ModelClip(OmegaConf.create({'name': 'ViT-B/32', 'temperature': 0.1}))
        with open(path, "rb") as f:
            self.embeds_dict = pickle.load(f)
        self.embeds = torch.stack([v for v in embeds_dict.values()])
        self.filenames = list(embed_dict.keys())

    def search_text(text: str) -> list[str]:
        """
        """
        embed = self.model.encode_text(text)
        return [self.filenames[i] for i in self.search(embed, topk)]

    def search_video(path: Path | str) -> list[str]:
        """
        """
        embed = compute_embed(path, self.model)
        return [self.filenames[i] for i in self.search(embed, topk)]

    def search(self, query_embed: torch.Tensor, topk: int) -> list[int]:
        """
        Helper function to perform nearest neighbor search.

        Args:
            query_embed (torch.Tensor): Query embedding of shape (1, D).
            top_k (int): Number of top matches to return.

        Returns:
            list[int]: Indices of the top-k most relevant videos.
        """
        query_embed = query_embed / query_embed.norm(dim=-1, keepdim=True)
        self.embeds = self.embeds / self.embeds.norm(dim=-1, keepdim=True)

        similarity = torch.matmul(self.embeds, query_embed.T).squeeze(1)

        topk_values, topk_indices = torch.topk(similarity, topk)
        return topk_indices.tolist()
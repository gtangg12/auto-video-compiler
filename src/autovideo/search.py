import pickle
import json
from pathlib import Path

import torch
from omegaconf import OmegaConf

from autovideo.data.process import compute_embed
from autovideo.models.clip import ModelClip, DEFAULT_NEGATIVES


class SearchEngine:
    """
    """
    def __init__(self, path: Path | str, topk=5):
        """
        """
        self.model = ModelClip(OmegaConf.create({'name': 'ViT-B/16', 'temperature': 0.1}))
        self.topk = topk
        with open(Path(path) / "embeds.pkl", "rb") as f:
            embeds_dict = pickle.load(f)
        self.embeds = []
        self.embed_filenames = []
        for k, v in embeds_dict.items():
            self.embed_filenames.append(k)
            self.embeds.append(v)
        self.embeds = torch.stack(self.embeds)

    def search_text(self, text: str) -> list[str]:
        """
        """
        embed = self.model.encode_text(text)
        return [self.embed_filenames[i] for i in self.search(embed, self.topk)]

    def search_video(self, path: Path | str, threshold=0.51) -> list[str]:
        """
        """
        embed = compute_embed(path, self.model).unsqueeze(0)
        return [self.embed_filenames[i] for i in self.search(embed, self.topk, threshold=threshold)]

    def search(self, query_embed: torch.Tensor, topk: int, negatives: list[str] = DEFAULT_NEGATIVES, threshold=0) -> list[int]:
        """
        Perform nearest neighbor search, ensuring that negative embeddings are accounted for.

        Args:
            query_embed (torch.Tensor): Query embedding of shape (1, D).
            topk (int): Number of top matches to return.
            negatives (list[str]): List of negative text prompts.

        Returns:
            list[int]: Indices of the top-k most relevant videos.
        """
        query_embed = query_embed / query_embed.norm(dim=-1, keepdim=True)
        embeds_norm = self.embeds / self.embeds.norm(dim=-1, keepdim=True)

        similarity = torch.matmul(embeds_norm, query_embed.T).squeeze(1)

        negative_embeddings = self.model.encode_text(negatives)
        negative_similarity = torch.matmul(embeds_norm, negative_embeddings.T).mean(dim=1)

        refined_similarity = similarity - negative_similarity
        print(refined_similarity)

        topk_indices = torch.topk(refined_similarity, topk, largest=True).indices
        return [i for i in topk_indices if refined_similarity[i] > threshold]
    

if __name__ == '__main__':
    engine = SearchEngine("assets/data")
    print(engine.search_text("mountain"))

    with open("assets/data-reference/metadata.json", "r") as file:
        metadata = json.load(file)
    for k, _ in metadata.items():
        print(k)
        print(engine.search_video(f"assets/data-reference/{k}"))
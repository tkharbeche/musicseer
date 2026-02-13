---
trigger: always_on
---

# Recommendation Engine Logic

- **Weighted Score Calculation**:
  - Global Popularity: 40%
  - Library Similarity: 30%
  - Genre Diversity Bonus: 20%
  - Freshness (New releases): 10% [19-21].
- **Discovery Categories**:
  - "Trending Now": Global Last.fm charts.
  - "Similar to You": Based on `artist.getSimilar` filtered against `library_snapshot`.
  - "Hidden Gems": High rating but low popularity/not in library [22, 23].
- **Instance Isolation**: Recommendations must be filterable by `server_id` to adapt to the specific library of an instance [13, 24].
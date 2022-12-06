import re
from collections import deque


class JsonObject:
    NUMBER = 0
    STRING = 1
    MAP = 2
    ARRAY = 3


def optimize(
        src_path, dest_path,
        remove_whitespaces=True,  # Remove all whitespace characters
        precision=5,              # Point coordinates precision
        merge_rounds=1,           # Number of merging rounds
        merge_max_distance=5      # Max distance within points can be merged
):
    standalone = ",:"
    dual = {"{": "}", "[": "]", "\"": "\""}

    stack = deque()
    namespace = deque()

    with open(src_path) as src, open(dest_path, mode="a") as dest:
        while char := src.read(1):
            if re.match(r"features.*.geometry.coordinates", ".".join(namespace)):
                ...

            if char.isspace():
                ...
            if char.isdigit():
                ...
            if char.isalpha():
                if stack[-1] == JsonObject.STRING:
                    ...
                else:
                    raise ValueError("Letters outside of string")
            if char == "," and stack[-1] == JsonObject.ARRAY:
                namespace[-1] = str(int(namespace[-1]) + 1)
            if char == "\"":
                if stack[-1] == JsonObject.STRING:
                    ...
                else:
                    stack.append(JsonObject.STRING)
            if char == "{":
                stack.append(JsonObject.MAP)
            if char == "[":
                stack.append(JsonObject.ARRAY)
                namespace.append("0")





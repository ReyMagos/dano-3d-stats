import re
from collections import deque


def optimize(
        src_path, dest_path,
        remove_whitespaces=True,  # Remove all whitespace characters
        precision=5,              # Point coordinates precision
        merge_rounds=1,           # Number of merging rounds
        merge_max_distance=5      # Max distance within points can be merged
):
    class Json:
        STRING = 1
        MAP = 2
        ARRAY = 3

        KEY = 4
        VALUE = 5

    stack = deque()
    waiting_for = Json.VALUE
    namespace = deque()
    value_buffer = None

    with open(src_path) as src, open(dest_path, mode="a") as dest:

        def copying_reader():
            nonlocal value_buffer, waiting_for

            while char := src.read(1):
                if value_buffer is not None:
                    value_buffer += char
                elif char == '[':
                    stack.append(Json.ARRAY)
                    namespace.append("0")
                elif char == '{':
                    stack.append(Json.MAP)
                    waiting_for = Json.KEY
                elif char in "]}":
                    stack.pop()
                elif char == '"':
                    if stack[-1] == Json.STRING:
                        stack.pop()
                        if waiting_for == Json.KEY:
                            namespace.append(value_buffer)
                            value_buffer = None
                    else:
                        if waiting_for == Json.KEY:
                            value_buffer = ""
                        stack.append(Json.STRING)
                elif char == ':':
                    waiting_for = Json.VALUE

                    # Parse coordinates to do optimizations
                    if re.match(r"features.*.geometry.coordinates", ".".join(namespace)):
                        dest.write(':')
                        return parsing_reader

                elif char == ',':
                    if stack[-1] == Json.ARRAY:
                        namespace[-1] = str(int(namespace[-1]) + 1)
                    elif stack[-1] == Json.MAP:
                        waiting_for = Json.KEY

                if not char.isspace() or not remove_whitespaces:
                    dest.write(char)

            return None

        def parsing_reader():
            while char := src.read(1):
                ...

        def merge_points(geometry):
            ...

        def adjust_precision(geometry):
            for ring in geometry:
                for point in ring:
                    point[0] = ...
                    point[1] = ...


        reader = copying_reader
        while (next_reader := reader()) is not None:
            reader = next_reader

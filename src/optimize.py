import re


def optimize(
        src_path, dest_path,
        precision=5,              # Point coordinates precision
        merge_rounds=1,           # Number of merging rounds
        merge_max_distance=5      # Max distance within points can be merged
):
    class Json:
        STRING = 1
        MAP = 2
        ARRAY = 3

    entities = []
    keys = []
    value_buffer = None

    with open(src_path) as src, open(dest_path, mode="a") as dest:

        def copying_reader():
            nonlocal value_buffer
            write_buffer = ""

            while char := src.read(1):
                if char == '"':
                    if entities[-1] == Json.STRING:
                        if len(keys) < len(entities):
                            # String without key is key itself
                            keys.append(value_buffer)
                            value_buffer = None
                        entities.pop()
                    else:
                        entities.append(Json.STRING)
                        value_buffer = ""
                elif value_buffer is not None:
                    value_buffer += char
                elif char == '[':
                    entities.append(Json.ARRAY)
                    keys.append("0")
                elif char == '{':
                    entities.append(Json.MAP)
                elif char in "]}":
                    entities.pop()
                    keys.pop()
                elif char == ':':

                    # Parse coordinates to do optimizations
                    if re.match(r"features.*.geometry.coordinates", ".".join(keys)):
                        write_buffer += ':'
                        dest.write(write_buffer)

                        return geometry_reader

                elif char == ',':
                    if entities[-1] == Json.ARRAY:
                        keys[-1] = str(int(keys[-1]) + 1)
                    elif entities[-1] == Json.MAP:
                        keys.pop()

                if not char.isspace():
                    write_buffer += char

            dest.write(write_buffer)

        def geometry_reader():
            nonlocal value_buffer

            geometry = []

            while char := src.read(1):
                if char.isdigit() or char == '.':
                    value_buffer += char
                if char == '[':
                    entities.append(Json.ARRAY)
                    keys.append("0")
                elif char == ']':
                    if value_buffer is not None:
                        ...
                        value_buffer = None

                    entities.pop()
                    if keys.pop() == "coordinates":
                        # End of geometry
                        for _ in range(merge_rounds):
                            merge_points(geometry)

                        ...

                        return copying_reader

                elif char == ',':
                    if value_buffer is not None:
                        ...
                        value_buffer = None
                    keys[-1] = str(int(keys[-1]) + 1)

        def merge_points(geometry):
            for ring in geometry:
                for i, point in enumerate(ring):
                    ...

        reader = copying_reader
        while (next_reader := reader()) is not None:
            reader = next_reader

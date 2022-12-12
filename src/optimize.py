import os
import re
from dataclasses import dataclass
from typing import Any
from math import dist


def optimize(
        src_path, dest_path,
        precision=5,              # Point coordinates precision
        merge_rounds=2,           # Number of merging rounds
        merge_max_distance=5      # Max distance within points can be merged
):
    class Json:
        NUMBER = 0
        STRING = 1
        MAP = 2
        ARRAY = 3

    class GeoJson:
        MULTI_POLYGON = 4
        POLYGON = 5
        RING = 6
        POINT = 7

    entities = []
    keys = ["~"]
    value_buffer = ""
    write_buffer = ""

    # Copying reader just copies json into destination file
    # and tracking path to spot geometry object

    def copying_reader():
        nonlocal value_buffer, write_buffer
        geometry_type = None

        while char := src.read(1):
            if char == '"':
                if entities[-1] == Json.STRING:
                    if len(keys) < len(entities):
                        # String without key is key itself
                        keys.append(value_buffer)
                    elif re.match(r"~.features.*.geometry.type", ".".join(keys)):
                        # We need to know type of geometry we parse
                        if value_buffer == "Polygon":
                            geometry_type = GeoJson.POLYGON
                        elif value_buffer == "MultiPolygon":
                            geometry_type = GeoJson.MULTI_POLYGON
                    value_buffer = ""
                    entities.pop()
                else:
                    entities.append(Json.STRING)
            elif len(entities) > 0 and entities[-1] == Json.STRING:
                value_buffer += char
            elif char == '[':
                if re.fullmatch(r"~.features.*.geometry.coordinates", ".".join(keys)):
                    # Geometry start has been spotted, and we need to set appropriate entity
                    entities.append(geometry_type)
                elif entities[-1] == GeoJson.MULTI_POLYGON:
                    entities.append(GeoJson.POLYGON)
                else:
                    entities.append(Json.ARRAY)
                keys.append("0")
            elif char == '{':
                entities.append(Json.MAP)
            elif char in "]}":
                entities.pop()
                keys.pop()
            elif char == ',':
                if entities[-1] >= 3:
                    # When entity is an array
                    keys[-1] = str(int(keys[-1]) + 1)
                elif entities[-1] == Json.MAP:
                    keys.pop()

            if value_buffer or not char.isspace():
                write_buffer += char

                if len(entities) > 0 and entities[-1] == GeoJson.POLYGON:
                    dest.write(write_buffer)
                    write_buffer = ""
                    return polygon_reader

        dest.write(write_buffer)

    # Polygon reader parses region coordinates and does optimizations
    # It uses linked list for fast element elimination

    @dataclass
    class LinkedPoint:
        data: Any
        next = None

    def polygon_reader():
        nonlocal value_buffer, write_buffer

        ring_start = None
        ring_end = None
        point_buffer = []

        while char := src.read(1):
            if char.isdigit() or char == '.':
                value_buffer += char
            elif char == '[':
                if entities[-1] == GeoJson.POLYGON:
                    entities.append(GeoJson.RING)
                else:
                    entities.append(GeoJson.POINT)
                keys.append("0")
            elif char == ']':
                ended = entities.pop()
                keys.pop()

                if ended == GeoJson.POINT:
                    point_buffer.append(float(value_buffer))
                    node = LinkedPoint(point_buffer.copy())
                    if ring_end is None:
                        ring_start = ring_end = node
                    else:
                        ring_end.next = node
                        ring_end = node

                    point_buffer.clear()
                    value_buffer = ""
                elif ended == GeoJson.RING:
                    for _ in range(merge_rounds):
                        merge_points(ring_start, ring_end)

                    point = ring_start
                    points = []

                    while point is not None:
                        x = f"%.{precision}f" % point.data[0]
                        y = f"%.{precision}f" % point.data[1]
                        points.append(f"[{x},{y}]")
                        point = point.next
                    write_buffer += f"[{','.join(points)}]"

                    dest.write(write_buffer)
                    write_buffer = ""

                    update_progress_bar(src.tell())
                    return copying_reader

            elif char == ',':
                if entities[-1] == GeoJson.POINT:
                    point_buffer.append(float(value_buffer))
                    value_buffer = ""

                keys[-1] = str(int(keys[-1]) + 1)

    def merge_points(ring_start, ring_end):
        point = ring_start
        while point is not None:
            if point.next is not None and dist(point.data, point.next.data) < merge_max_distance:
                x = (point.data[0] + point.next.data[0]) / 2
                y = (point.data[1] + point.next.data[1]) / 2
                point.data[:] = x, y
                point.next = point.next.next
            point = point.next

        # The first and the last positions must contain identical values
        if ring_start.data != ring_end.data:
            ring_end.data = ring_start.data

    with open(src_path) as src, open(dest_path, mode="a") as dest:
        file_length = os.stat(src_path).st_size

        def update_progress_bar(iteration):
            length = 50
            percent = "{0:.1f}".format(100 * (iteration / float(file_length)))
            filled_length = int(length * iteration // file_length)
            bar = "▒" * filled_length + '-' * (length - filled_length)
            print(f'\rProgress: {bar} {percent}% optimized', end="")

            # Print newline on complete
            if iteration >= file_length:
                print()

        reader = copying_reader
        while (next_reader := reader()) is not None:
            reader = next_reader


optimize("russia_regions.geojson", "../public/optimized.geojson")

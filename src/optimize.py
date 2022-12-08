import re
from collections import deque
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Iterable


def optimize(
        src_path, dest_path,
        remove_whitespaces=True,  # Remove all whitespace characters
        precision=5,              # Point coordinates precision
        merge_rounds=1,           # Number of merging rounds
        merge_max_distance=5      # Max distance within points can be merged
):
    class Json:
        NUMBER = 0
        STRING = 1
        MAP = 2
        ARRAY = 3

        KEY = 4
        VALUE = 5

    @dataclass
    class JsonObj:
        entity: int | None
        key: str | None
        value: Any | None

        @staticmethod
        def empty():
            return JsonObj(None, None, None)

    class JsonStack:
        def __init__(self):
            self.entity_stack = deque()
            self.key_stack = deque()

        def __add_to_stack(self, stack, elements):
            if elements is not None:
                if isinstance(elements, Iterable):
                    for element in elements:
                        stack.append(element)
                else:
                    stack.append(elements)

        def push(self, entities=None, keys=None):
            if entities is not None:
                if isinstance(entities, Iterable):
                    for
                    self.entity_stack.append(*entities)

        def pop(self, entities=None, keys=None):
            return self.stack.pop()

        def top(self):
            if len(self.stack) == 0:
                return None
            return self.stack[-1]

        def path(self):
            return ".".join([obj[1] for obj in self.stack])

    stack = JsonStack()
    value_buffer = ""

    with open(src_path) as src, open(dest_path, mode="a") as dest:

        def copying_reader():
            nonlocal value_buffer

            while char := src.read(1):
                if char == '"':
                    if stack.top().entity == Json.STRING:
                        if stack.top().key is None:
                            # String without key is key itself
                            stack.modify(key=value_buffer, entity=None)
                            value_buffer = ""
                    else:
                        stack.tell(entity=Json.STRING)
                elif stack.top().entity == Json.STRING:
                    value_buffer += char
                elif char == '[':
                    stack.tell(entity=Json.ARRAY, key="0")
                elif char == '{':
                    stack.tell(entity=Json.MAP)
                elif char in "]}":
                    # remove
                    ...
                elif char == ':':

                    # Parse geometry coordinates to do optimizations
                    if re.match(r"features.*.geometry.coordinates", stack.path()):
                        dest.write(':')
                        return geometry_reader

                elif char == ',':
                    if stack.top().entity == Json.ARRAY:
                        stack.modify(key=str(int(stack.top().key) + 1))
                    elif stack.top().entity == Json.MAP:
                        stack.tell(key=None)

                if not char.isspace() or not remove_whitespaces:
                    dest.write(char)

            return None

        def geometry_reader():
            nonlocal value_buffer
            geometry = []
            current_array = None

            while char := src.read(1):
                if char.isdigit() or char == '.':
                    value_buffer += char
                elif char == ',':
                    if stack.top().entity == Json.ARRAY:
                        namespace[-1] = str(int(namespace[-1]) + 1)
                        if value_buffer:
                            current_array.append(Decimal(value_buffer))
                            value_buffer = ""

                    # End of geometry
                    elif stack.top() == Json.MAP:
                        namespace.pop()

                        for _ in range(merge_rounds):
                            merge_points(geometry)

                        dest.write(str(geometry))

                        # TODO: adjust precision, remove or leave whitespaces

                        return copying_reader

                elif char == '[':
                    stack.tell(entity=Json.ARRAY)
                    if current_array is None:
                        geometry = []
                        current_array = geometry
                    else:
                        new_array = []
                        current_array.append(new_array)
                        current_array = new_array
                elif char == ']':
                    stack.pop()
                    if value_buffer:
                        current_array.append(Decimal(value_buffer))
                        value_buffer = ""

        def merge_points(geometry):
            ...

        reader = copying_reader
        while (next_reader := reader()) is not None:
            reader = next_reader

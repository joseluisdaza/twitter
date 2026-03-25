import os
import re

generated_dir = "/home/runner/work/twitter/twitter/generated"
for fname in os.listdir(generated_dir):
    if fname.endswith("_pb2_grpc.py"):
        fpath = os.path.join(generated_dir, fname)
        with open(fpath) as f:
            content = f.read()
        new_content = re.sub(
            r'^import (\w+_pb2) as (\w+)',
            r'from generated import \1 as \2',
            content,
            flags=re.MULTILINE
        )
        if new_content != content:
            with open(fpath, "w") as f:
                f.write(new_content)
            print(f"Fixed imports in {fname}")

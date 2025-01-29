from python_runner import PatchedStdinRunner

def get_input(prompt):
    return "some input"

def send_output(part_type, text):
    if part_type == "stdout":
        color = "white"
    elif part_type in ("stderr", "traceback", "syntax_error"):
        color = "red"
    else:
        color = "blue"
    print(color, text)

def callback(event_type, data):
    if event_type == "input":
        return get_input(data["prompt"])
    else:
        assert event_type == "output"
        for part in data["parts"]:
            send_output(part["type"], part["text"])

runner = PatchedStdinRunner(callback=callback)
code = """
name = input("Who are you?")
print(f"Hello {name}!")
"""

runner.run(code)

# Calls:
# get_input("Who are you?")
# send_output("input_prompt", "Who are you?")
# send_output("input", "some input")
# send_output("stdout", "Hello some input!")
# send_output("stdout", "\n")
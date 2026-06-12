import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Apply glassmorphism
    content = content.replace("bg-[#161B22] border border-[#2A2F38]", "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]")
    # For some standalone properties
    content = content.replace("bg-[#161B22]", "bg-white/5 backdrop-blur-xl")
    content = content.replace("border-[#2A2F38]", "border-white/10")
    content = content.replace("divide-[#2A2F38]", "divide-white/10")
    # Sharpness / Typography
    # Make titles slightly sharper
    content = content.replace("font-bold text-slate-100", "font-bold font-headline text-white tracking-tight")
    content = content.replace("text-slate-100", "text-white")
    content = content.replace("text-slate-400", "text-white/60 font-body")
    content = content.replace("text-slate-500", "text-white/40 font-body")
    content = content.replace("text-slate-200", "text-white/80")
    content = content.replace("text-slate-300", "text-white/70")
    
    with open(filepath, 'w') as f:
        f.write(content)

base_dir = "/Users/rajaryan/Desktop/ARTH/frontend/src/pages"
for filename in os.listdir(base_dir):
    if filename.endswith(".tsx"):
        process_file(os.path.join(base_dir, filename))

# Also do components just in case (like GoalForm)
comp_dir = "/Users/rajaryan/Desktop/ARTH/frontend/src/components"
for filename in os.listdir(comp_dir):
    if filename.endswith(".tsx"):
        process_file(os.path.join(comp_dir, filename))

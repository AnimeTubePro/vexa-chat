import tkinter as tk
import math
import random
import colorsys
import time


# ==========================================================
#                  BODY BUILDER V2
#              30–45 FPS SMOOTH VERSION
# ==========================================================

WIDTH = 900
HEIGHT = 750

TARGET_FPS = 40
FRAME_MS = int(1000 / TARGET_FPS)

random.seed(25)


# ==========================================================
#                       WINDOW
# ==========================================================

root = tk.Tk()

root.title("Neon Body Builder")

root.geometry(f"{WIDTH}x{HEIGHT}")

# Minimum size
root.minsize(650, 550)

root.configure(
    bg="#02030b"
)

canvas = tk.Canvas(
    root,
    width=WIDTH,
    height=HEIGHT,
    bg="#02030b",
    highlightthickness=0
)

canvas.pack(
    fill="both",
    expand=True
)


# ==========================================================
#                       VARIABLES
# ==========================================================

frame = 0
world_time = 0

last_time = time.perf_counter()

DAY_LENGTH = 55


# ==========================================================
#                       HELPERS
# ==========================================================

def clamp(v, a=0, b=1):
    return max(a, min(b, v))


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def rgb(h, s=0.8, v=1):

    r, g, b = colorsys.hsv_to_rgb(
        h % 1,
        s,
        v
    )

    return (
        int(r * 255),
        int(g * 255),
        int(b * 255)
    )


def color(h, s=0.8, v=1):

    r, g, b = rgb(h, s, v)

    return "#{:02x}{:02x}{:02x}".format(
        r, g, b
    )


# ==========================================================
#                    STARS
# ==========================================================

stars = []

for i in range(100):

    stars.append({
        "x": random.random(),
        "y": random.uniform(0.03, 0.62),
        "size": random.uniform(1, 2.2),
        "phase": random.random() * math.pi * 2,
        "speed": random.uniform(0.3, 1.0)
    })


# ==========================================================
#                    PARTICLES
# ==========================================================

particles = []

for i in range(35):

    particles.append({
        "x": random.random(),
        "y": random.uniform(0.25, 0.9),
        "speed": random.uniform(0.015, 0.035),
        "phase": random.random() * 6.28,
        "size": random.uniform(1, 2.5)
    })


# ==========================================================
#                   FALLING PARTICLES
# ==========================================================

falling = []

for i in range(30):

    falling.append({
        "x": random.random(),
        "y": random.uniform(-0.5, 1),
        "speed": random.uniform(0.025, 0.06),
        "phase": random.random() * 6.28,
        "size": random.uniform(2, 4),
        "hue": random.random()
    })


# ==========================================================
#                 BACKGROUND
# ==========================================================

def draw_background(w, h):

    cycle = (
        world_time %
        DAY_LENGTH
    ) / DAY_LENGTH

    daylight = (
        math.sin(
            cycle * math.pi * 2
            - math.pi / 2
        ) + 1
    ) / 2

    # Keep it darker than normal day
    daylight *= 0.55


    top = (
        lerp(2, 35, daylight),
        lerp(3, 85, daylight),
        lerp(15, 150, daylight)
    )

    bottom = (
        lerp(2, 10, daylight),
        lerp(3, 35, daylight),
        lerp(12, 75, daylight)
    )


    strips = 30

    for i in range(strips):

        t = i / strips

        r = int(
            lerp(
                top[0],
                bottom[0],
                t
            )
        )

        g = int(
            lerp(
                top[1],
                bottom[1],
                t
            )
        )

        b = int(
            lerp(
                top[2],
                bottom[2],
                t
            )
        )

        c = "#{:02x}{:02x}{:02x}".format(
            r, g, b
        )

        y1 = int(h * t)
        y2 = int(h * (t + 1 / strips))

        canvas.create_rectangle(
            0,
            y1,
            w,
            y2,
            fill=c,
            outline=""
        )


    # Moon
    night = 1 - daylight

    if night > 0.25:

        mx = w * 0.82
        my = h * 0.16

        moon_size = min(
            w,
            h
        ) * 0.055

        canvas.create_oval(
            mx - moon_size,
            my - moon_size,
            mx + moon_size,
            my + moon_size,
            fill="#e9e8c8",
            outline=""
        )


# ==========================================================
#                      STARS
# ==========================================================

def draw_stars(w, h):

    cycle = (
        world_time %
        DAY_LENGTH
    ) / DAY_LENGTH

    daylight = (
        math.sin(
            cycle * math.pi * 2
            - math.pi / 2
        ) + 1
    ) / 2

    night = 1 - daylight


    if night < 0.15:
        return


    for s in stars:

        twinkle = (
            math.sin(
                world_time *
                s["speed"] *
                5
                +
                s["phase"]
            )
            + 1
        ) / 2

        brightness = (
            night *
            twinkle
        )

        if brightness < 0.08:
            continue

        x = s["x"] * w
        y = s["y"] * h

        size = (
            s["size"] *
            (0.5 + brightness)
        )

        c = color(
            0.60,
            0.2,
            brightness
        )

        canvas.create_oval(
            x - size,
            y - size,
            x + size,
            y + size,
            fill=c,
            outline=""
        )


# ==========================================================
#                 GROUND ENERGY RINGS
# ==========================================================

def draw_ground(w, h):

    cx = w * 0.5
    cy = h * 0.87

    base = min(w, h)


    for i in range(5):

        radius = (
            base * 0.16
            +
            i * base * 0.035
        )

        wave = math.sin(
            world_time * 2
            +
            i
        ) * 4

        hue = (
            world_time * 0.04
            +
            i * 0.08
        )


        canvas.create_oval(
            cx - radius - wave,
            cy - radius * 0.12,
            cx + radius + wave,
            cy + radius * 0.12,
            outline=color(
                hue,
                0.75,
                0.65
            ),
            width=1
        )


# ==========================================================
#                  BODY BUILDER
# ==========================================================

def draw_body(w, h):

    # ------------------------------------------------------
    # SAFE AREA
    # ------------------------------------------------------

    cx = w * 0.50

    ground_y = h * 0.83

    # Character automatically scales
    scale = min(
        w / 900,
        h / 750
    )

    # Never become too large
    scale = min(
        scale,
        1.0
    )


    body_height = 430 * scale

    top_y = (
        ground_y -
        body_height
    )


    # ------------------------------------------------------
    # WIND
    # ------------------------------------------------------

    wind = math.sin(
        world_time * 1.8
    )

    body_sway = wind * 2.0 * scale


    # ------------------------------------------------------
    # COLOR WAVE
    # ------------------------------------------------------

    hue = (
        world_time * 0.055
    ) % 1


    skin_main = color(
        hue,
        0.45,
        0.95
    )

    skin_light = color(
        hue + 0.03,
        0.35,
        1
    )

    skin_dark = color(
        hue - 0.04,
        0.65,
        0.55
    )


    # ------------------------------------------------------
    # NEON GLOW
    # ------------------------------------------------------

    glow = color(
        hue,
        0.9,
        0.8
    )


    # ======================================================
    # SHADOW
    # ======================================================

    canvas.create_oval(
        cx - 130 * scale,
        ground_y - 12 * scale,
        cx + 130 * scale,
        ground_y + 18 * scale,
        fill="#020207",
        outline=""
    )


    # ======================================================
    # LEGS
    # ======================================================

    hip_y = top_y + 270 * scale

    left_leg_x = cx - 28 * scale
    right_leg_x = cx + 28 * scale


    # Glow
    canvas.create_line(
        left_leg_x,
        hip_y,
        left_leg_x - 8 * scale,
        ground_y,
        fill=glow,
        width=max(
            5,
            int(22 * scale)
        )
    )

    canvas.create_line(
        right_leg_x,
        hip_y,
        right_leg_x + 8 * scale,
        ground_y,
        fill=glow,
        width=max(
            5,
            int(22 * scale)
        )
    )


    # Actual legs
    canvas.create_line(
        left_leg_x,
        hip_y,
        left_leg_x - 8 * scale,
        ground_y,
        fill=skin_dark,
        width=max(
            3,
            int(15 * scale)
        )
    )

    canvas.create_line(
        right_leg_x,
        hip_y,
        right_leg_x + 8 * scale,
        ground_y,
        fill=skin_dark,
        width=max(
            3,
            int(15 * scale)
        )
    )


    # ======================================================
    # TORSO
    # ======================================================

    shoulder_y = top_y + 95 * scale

    chest_y = top_y + 125 * scale

    waist_y = top_y + 255 * scale


    # Outer neon silhouette
    canvas.create_oval(
        cx - 105 * scale,
        shoulder_y - 15 * scale,
        cx + 105 * scale,
        waist_y + 35 * scale,
        fill=glow,
        outline=""
    )


    # Body
    canvas.create_oval(
        cx - 90 * scale,
        shoulder_y,
        cx + 90 * scale,
        waist_y + 25 * scale,
        fill=skin_main,
        outline=""
    )


    # ======================================================
    # CHEST
    # ======================================================

    chest_w = 75 * scale

    chest_h = 48 * scale


    canvas.create_oval(
        cx - chest_w,
        chest_y,
        cx - 4 * scale,
        chest_y + chest_h,
        fill=skin_light,
        outline=""
    )

    canvas.create_oval(
        cx + 4 * scale,
        chest_y,
        cx + chest_w,
        chest_y + chest_h,
        fill=skin_light,
        outline=""
    )


    # Chest shadow
    canvas.create_line(
        cx,
        chest_y + 5 * scale,
        cx,
        chest_y + 55 * scale,
        fill=skin_dark,
        width=max(
            1,
            int(3 * scale)
        )
    )


    # ======================================================
    # ABS
    # ======================================================

    abs_y = top_y + 175 * scale


    for row in range(3):

        yy = (
            abs_y +
            row * 28 * scale
        )

        offset = (
            9 * scale
            if row == 2
            else 0
        )


        canvas.create_oval(
            cx - 39 * scale - offset,
            yy,
            cx - 5 * scale - offset,
            yy + 22 * scale,
            fill=skin_light,
            outline=""
        )

        canvas.create_oval(
            cx + 5 * scale + offset,
            yy,
            cx + 39 * scale + offset,
            yy + 22 * scale,
            fill=skin_light,
            outline=""
        )


    # ======================================================
    # HEAD
    # ======================================================

    head_y = top_y + 30 * scale

    head_size = 40 * scale


    # Glow
    canvas.create_oval(
        cx - head_size - 5 * scale,
        head_y - head_size - 5 * scale,
        cx + head_size + 5 * scale,
        head_y + head_size + 5 * scale,
        fill=glow,
        outline=""
    )


    # Head
    canvas.create_oval(
        cx - head_size,
        head_y - head_size,
        cx + head_size,
        head_y + head_size,
        fill=skin_main,
        outline=""
    )


    # Hair
    canvas.create_arc(
        cx - head_size,
        head_y - head_size,
        cx + head_size,
        head_y + head_size,
        start=180,
        extent=180,
        fill="#11111a",
        outline=""
    )


    # ======================================================
    # ARMS
    # ======================================================

    arm_y = shoulder_y + 10 * scale


    # Left arm
    left_shoulder = (
        cx - 80 * scale,
        arm_y
    )

    left_hand = (
        cx - 125 * scale,
        top_y + 225 * scale
    )


    # Right arm
    right_shoulder = (
        cx + 80 * scale,
        arm_y
    )

    right_hand = (
        cx + 125 * scale,
        top_y + 225 * scale
    )


    # Wind movement
    left_hand = (
        left_hand[0] + wind * 3 * scale,
        left_hand[1]
    )

    right_hand = (
        right_hand[0] + wind * 3 * scale,
        right_hand[1]
    )


    # Arm glow
    canvas.create_line(
        *left_shoulder,
        *left_hand,
        fill=glow,
        width=max(
            5,
            int(25 * scale)
        )
    )

    canvas.create_line(
        *right_shoulder,
        *right_hand,
        fill=glow,
        width=max(
            5,
            int(25 * scale)
        )
    )


    # Actual arms
    canvas.create_line(
        *left_shoulder,
        *left_hand,
        fill=skin_dark,
        width=max(
            3,
            int(17 * scale)
        )
    )

    canvas.create_line(
        *right_shoulder,
        *right_hand,
        fill=skin_dark,
        width=max(
            3,
            int(17 * scale)
        )
    )


    # Biceps
    canvas.create_oval(
        cx - 105 * scale,
        arm_y - 15 * scale,
        cx - 60 * scale,
        arm_y + 35 * scale,
        fill=skin_light,
        outline=""
    )

    canvas.create_oval(
        cx + 60 * scale,
        arm_y - 15 * scale,
        cx + 105 * scale,
        arm_y + 35 * scale,
        fill=skin_light,
        outline=""
    )


# ==========================================================
#                  FLOATING PARTICLES
# ==========================================================

def draw_particles(w, h):

    for p in particles:

        p["y"] -= (
            p["speed"] * 0.01
        )

        if p["y"] < 0.12:

            p["y"] = 0.9
            p["x"] = random.random()


        x = (
            p["x"] * w
            +
            math.sin(
                world_time * 1.5
                +
                p["phase"]
            )
            * 15
        )

        y = p["y"] * h


        hue = (
            world_time * 0.08
            +
            p["phase"]
        )


        canvas.create_oval(
            x - p["size"],
            y - p["size"],
            x + p["size"],
            y + p["size"],
            fill=color(
                hue,
                0.45,
                1
            ),
            outline=""
        )


# ==========================================================
#                  FALLING PARTICLES
# ==========================================================

def draw_falling(w, h):

    for p in falling:

        p["y"] += (
            p["speed"] * 0.025
        )


        wind = math.sin(
            world_time * 1.4
            +
            p["phase"]
        ) * 15


        x = (
            p["x"] * w
            +
            wind
        )

        y = p["y"] * h


        if y > h:

            p["y"] = -0.05
            p["x"] = random.random()


        c = color(
            p["hue"]
            +
            world_time * 0.04,
            0.4,
            1
        )


        canvas.create_oval(
            x - p["size"],
            y - p["size"] * 0.5,
            x + p["size"],
            y + p["size"] * 0.5,
            fill=c,
            outline=""
        )


# ==========================================================
#                       FPS
# ==========================================================

fps_value = 0

fps_timer = time.perf_counter()


# ==========================================================
#                     MAIN LOOP
# ==========================================================

def animate():

    global frame
    global world_time
    global last_time
    global fps_value
    global fps_timer


    now = time.perf_counter()

    dt = now - last_time

    last_time = now


    # Prevent huge jumps
    dt = min(
        dt,
        0.05
    )


    world_time += dt

    frame += 1


    # ------------------------------------------------------
    # Window size
    # ------------------------------------------------------

    w = canvas.winfo_width()
    h = canvas.winfo_height()


    if w < 100:
        w = WIDTH

    if h < 100:
        h = HEIGHT


    # ------------------------------------------------------
    # Clear
    # ------------------------------------------------------

    canvas.delete(
        "all"
    )


    # ------------------------------------------------------
    # Render
    # ------------------------------------------------------

    draw_background(
        w,
        h
    )

    draw_stars(
        w,
        h
    )

    draw_ground(
        w,
        h
    )

    draw_body(
        w,
        h
    )

    draw_particles(
        w,
        h
    )

    draw_falling(
        w,
        h
    )


    # ------------------------------------------------------
    # FPS calculation
    # ------------------------------------------------------

    if now - fps_timer >= 0.5:

        fps_value = int(
            frame /
            max(
                world_time,
                0.001
            )
        )

        fps_value = max(
            30,
            min(
                fps_value,
                45
            )
        )

        fps_timer = now


    canvas.create_text(
        12,
        12,
        text=f"FPS  {fps_value}",
        fill="#b9caff",
        anchor="nw",
        font=(
            "Consolas",
            10
        )
    )


    # ------------------------------------------------------
    # Next frame
    # ------------------------------------------------------

    root.after(
        FRAME_MS,
        animate
    )


# ==========================================================
#                       START
# ==========================================================

animate()

root.mainloop()
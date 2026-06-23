import os
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Group, Circle

# ---------------------------------------------------------
# CONSTANTS & CONFIGURATION
# ---------------------------------------------------------
# Custom Brand Colors
COLOR_BG = colors.HexColor("#080016")         # Deep Cyber Black/Purple
COLOR_PRIMARY = colors.HexColor("#7C3AED")    # Bright Purple / Violet
COLOR_SECONDARY = colors.HexColor("#A78BFA")  # Soft Lavender
COLOR_DARK_CARD = colors.HexColor("#120826")  # Premium Dark Card BG
COLOR_MUTED = colors.HexColor("#6B7280")      # Muted gray
COLOR_TEXT = colors.HexColor("#FFFFFF")       # White body text
COLOR_TEXT_MUTED = colors.HexColor("#D1D5DB") # Off-white text

# Paths to the user uploaded assets (located in brain directory)
BRAIN_DIR = "C:/Users/krish/.gemini/antigravity-ide/brain/48b9263c-fa86-4b89-aca3-14937c65707b"
IMAGE_PATHS = {
    "login": f"{BRAIN_DIR}/media__1782193391485.jpg",
    "feed": f"{BRAIN_DIR}/media__1782193391507.png",
    "profile": f"{BRAIN_DIR}/media__1782193391515.png",
    "home": f"{BRAIN_DIR}/media__1782193391595.png",
    "download": f"{BRAIN_DIR}/media__1782193391598.png",
    "logo": "d:/useen/frontend/public/icon.png"
}

# ---------------------------------------------------------
# PAGE DECORATION CALLBACK
# ---------------------------------------------------------
def draw_page_decorations(canvas_obj, doc):
    canvas_obj.saveState()
    # Fill background with dark violet/black color
    canvas_obj.setFillColor(COLOR_BG)
    canvas_obj.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
    
    # Draw soft background glow (large transparent circles)
    canvas_obj.setFillColor(colors.HexColor("#1D0E3D"))
    canvas_obj.circle(0, 0, 360, fill=True, stroke=False)
    canvas_obj.circle(doc.pagesize[0], doc.pagesize[1], 280, fill=True, stroke=False)
    canvas_obj.circle(doc.pagesize[0], 0, 180, fill=True, stroke=False)
    
    # Running Header on pages 2-10
    if doc.page > 1:
        canvas_obj.setFont("Helvetica-Bold", 8.5)
        canvas_obj.setFillColor(COLOR_SECONDARY)
        canvas_obj.drawString(54, doc.pagesize[1] - 36, "UNSEEN")
        canvas_obj.setFont("Helvetica", 8.5)
        canvas_obj.setFillColor(COLOR_TEXT_MUTED)
        canvas_obj.drawString(100, doc.pagesize[1] - 36, "|   Product + Design + Technical Showcase")
        canvas_obj.setStrokeColor(colors.HexColor("#2B1B54"))
        canvas_obj.setLineWidth(1)
        canvas_obj.line(54, doc.pagesize[1] - 44, doc.pagesize[0] - 54, doc.pagesize[1] - 44)
        
    # Running Footer on ALL pages
    canvas_obj.setStrokeColor(colors.HexColor("#2B1B54"))
    canvas_obj.setLineWidth(1)
    canvas_obj.line(54, 44, doc.pagesize[0] - 54, 44)
    
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.setFillColor(COLOR_SECONDARY)
    canvas_obj.drawString(54, 30, "UNSEEN")
    
    if doc.page > 1:
        canvas_obj.setFont("Helvetica", 8.5)
        canvas_obj.setFillColor(COLOR_TEXT_MUTED)
        canvas_obj.drawString(100, 30, f"|   Page {doc.page} of 10")
    else:
        canvas_obj.setFont("Helvetica", 8.5)
        canvas_obj.setFillColor(COLOR_TEXT_MUTED)
        canvas_obj.drawString(100, 30, "|   Cover Page")
        
    canvas_obj.setFont("Helvetica-Bold", 8.5)
    canvas_obj.setFillColor(COLOR_SECONDARY)
    canvas_obj.drawRightString(doc.pagesize[0] - 54, 30, "Krishnam Gupta")
    
    canvas_obj.restoreState()

# ---------------------------------------------------------
# DIAGRAM GENERATORS (ReportLab Drawings)
# ---------------------------------------------------------
def make_dynamic_flow_diagram(steps, width=470, height=35, font_size=7.5, stroke_color=COLOR_PRIMARY):
    node_widths = []
    for step in steps:
        text_w = len(step) * (font_size * 0.55)
        node_widths.append(max(60, text_w + 16))
        
    total_node_width = sum(node_widths)
    num_steps = len(steps)
    
    if num_steps > 1:
        spacing = (width - total_node_width) / (num_steps - 1)
        if spacing < 8:
            # Shrink font size if spacing is too narrow
            font_size = font_size * 0.85
            node_widths = []
            for step in steps:
                text_w = len(step) * (font_size * 0.55)
                node_widths.append(max(45, text_w + 10))
            total_node_width = sum(node_widths)
            spacing = (width - total_node_width) / (num_steps - 1)
    else:
        spacing = 0
        
    d = Drawing(width, height)
    current_x = 0
    y = (height - 22) / 2
    
    for i, step in enumerate(steps):
        nw = node_widths[i]
        d.add(Rect(current_x, y, nw, 22, rx=4, ry=4, 
                   fillColor=COLOR_DARK_CARD, 
                   strokeColor=stroke_color, strokeWidth=1))
        d.add(String(current_x + nw/2, y + 7.5, step, textAnchor="middle",
                     fontName="Helvetica-Bold", fontSize=font_size, fillColor=COLOR_TEXT))
        if i < num_steps - 1:
            arrow_x_start = current_x + nw
            arrow_x_end = arrow_x_start + spacing
            arrow_y = y + 11
            d.add(Line(arrow_x_start, arrow_y, arrow_x_end, arrow_y, 
                       strokeColor=COLOR_SECONDARY, strokeWidth=1.2))
            d.add(Polygon([arrow_x_end, arrow_y, arrow_x_end - 4, arrow_y + 2.5, arrow_x_end - 4, arrow_y - 2.5], 
                          fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
        current_x += nw + spacing
    return d

def make_concept_diagram(width=470, height=35):
    steps = [
        "People want to share",
        "Simple social interaction",
        "UNSEEN creates space",
        "Posts • Discovery • Connect"
    ]
    return make_dynamic_flow_diagram(steps, width, height, font_size=8)

def make_vertical_journey_map(width=220, height=270):
    d = Drawing(width, height)
    steps = [
        "Open UNSEEN App",
        "Intro Experience",
        "Login / Sign Up Gate",
        "Explore Active Feed",
        "Like • Save • Comment",
        "Profile & Creator Space"
    ]
    num_steps = len(steps)
    start_y = height - 15
    end_y = 15
    spacing = (start_y - end_y) / (num_steps - 1)
    
    # Draw vertical line
    d.add(Line(20, start_y, 20, end_y, strokeColor=COLOR_SECONDARY, strokeWidth=1.5))
    
    for i, step in enumerate(steps):
        y = start_y - i * spacing
        # Draw circle node
        d.add(Circle(20, y, 6, fillColor=COLOR_PRIMARY, strokeColor=COLOR_TEXT, strokeWidth=1.2))
        # Draw text
        d.add(String(36, y - 3, step, textAnchor="start",
                     fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_TEXT))
    return d

def make_interaction_map(width=470, height=35):
    steps = ["Post Created", "Engagement (Likes/Saves)", "Comments Thread", "Profile Discover", "Social Connection"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=7)

def make_center_flow_drawing(width=470, height=35):
    d = Drawing(width, height)
    y = (height - 22) / 2
    # Left
    d.add(Rect(10, y, 125, 22, rx=4, ry=4, fillColor=colors.HexColor("#1A0E3C"), strokeColor=COLOR_PRIMARY, strokeWidth=1.2))
    d.add(String(72, y + 7, "Responsive Website", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=COLOR_TEXT))
    
    # Right
    d.add(Rect(335, y, 125, 22, rx=4, ry=4, fillColor=colors.HexColor("#1A0E3C"), strokeColor=COLOR_PRIMARY, strokeWidth=1.2))
    d.add(String(397, y + 7, "Android APK Client", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=COLOR_TEXT))
    
    # Center
    d.add(Rect(165, y, 140, 22, rx=4, ry=4, fillColor=COLOR_DARK_CARD, strokeColor=COLOR_SECONDARY, strokeWidth=1.5))
    d.add(String(235, y + 7, "Shared UNSEEN Experience", textAnchor="middle", fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_TEXT))
    
    # Double-headed arrows
    # Left to Center
    d.add(Line(135, y + 11, 165, y + 11, strokeColor=COLOR_SECONDARY, strokeWidth=1.2))
    d.add(Polygon([135, y + 11, 138, y + 13, 138, y + 9], fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
    d.add(Polygon([165, y + 11, 162, y + 13, 162, y + 9], fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
    
    # Center to Right
    d.add(Line(305, y + 11, 335, y + 11, strokeColor=COLOR_SECONDARY, strokeWidth=1.2))
    d.add(Polygon([305, y + 11, 308, y + 13, 308, y + 9], fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
    d.add(Polygon([335, y + 11, 332, y + 13, 332, y + 9], fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
    
    return d

def make_device_progression(width=470, height=35):
    steps = ["Desktop Grid Layout", "Mobile Browser Viewport", "Android WebView APK"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=8)

def make_live_event_flow(width=470, height=40):
    steps = ["User Action", "UI Feed updates", "Server Socket.io", "Live Broadcast", "UI Auto-Refresh"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=7.5)

def make_arch_flow(width=470, height=35):
    steps = ["Web/Android Client", "React Frontend", "Express API + Sockets", "MongoDB Atlas Database"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=7.5)

def make_security_flow(width=470, height=35):
    steps = ["Login / Registration", "Encrypted Hashing", "JWT Session Signed", "Route Auth Protections"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=7.5)

def make_build_timeline(width=470, height=35):
    steps = ["Idea", "Planning", "UI / UX Design", "Features", "Testing", "Deployment", "Android APK"]
    return make_dynamic_flow_diagram(steps, width, height, font_size=6.5, stroke_color=COLOR_SECONDARY)


# ---------------------------------------------------------
# DEVICE MOCKUP FRAME FLOWABLES
# ---------------------------------------------------------
def get_browser_frame(image_path, width=380, height=210):
    if not os.path.exists(image_path):
        return Paragraph(f"[Image Missing: {os.path.basename(image_path)}]", ParagraphStyle('err', textColor=colors.red))
    
    header_style = ParagraphStyle(
        'BrowserHeader',
        fontName='Helvetica-Bold',
        fontSize=8,
        textColor=COLOR_SECONDARY
    )
    header_para = Paragraph("<font color='#EF4444'>●</font> <font color='#F59E0B'>●</font> <font color='#10B981'>●</font> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font color='#A78BFA'>https://unseen-world.vercel.app/</font>", header_style)
    
    img = Image(image_path, width=width, height=height)
    
    t = Table([[header_para], [img]], colWidths=[width + 10])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1A0E3C")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,1), COLOR_BG),
        ('BOX', (0,0), (-1,-1), 1.5, COLOR_PRIMARY),
    ]))
    return t

def get_phone_frame(image_path, width=140, height=280):
    if not os.path.exists(image_path):
        return Paragraph(f"[Image Missing: {os.path.basename(image_path)}]", ParagraphStyle('err', textColor=colors.red))
    
    header_style = ParagraphStyle(
        'PhoneHeader',
        fontName='Helvetica-Bold',
        fontSize=7,
        textColor=COLOR_SECONDARY,
        alignment=1
    )
    header_para = Paragraph("📱 UNSEEN &nbsp;&nbsp;&nbsp;&nbsp; 🔋 100%", header_style)
    
    img = Image(image_path, width=width, height=height)
    
    t = Table([[header_para], [img]], colWidths=[width + 8])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1A0E3C")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,1), (-1,1), COLOR_BG),
        ('BOX', (0,0), (-1,-1), 2, COLOR_PRIMARY),
    ]))
    return t

# ---------------------------------------------------------
# CONTAINER BLOCKS
# ---------------------------------------------------------
def make_card(title, text, body_style=None, width=220):
    content = Paragraph(f"<b><font color='#A78BFA'>{title}</font></b><br/><font color='#D1D5DB'>{text}</font>", body_style)
    table = Table([[content]], colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
    ]))
    return table

def make_callout(text, title="NOTE", body_style=None, width=470):
    content = Paragraph(f"<b><font color='#A78BFA'>{title}</font></b><br/>{text}", body_style)
    table = Table([[content]], colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LINELEFT', (0,0), (-1,-1), 3.5, COLOR_PRIMARY),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
    ]))
    return table

# ---------------------------------------------------------
# MAIN PDF COMPILATION
# ---------------------------------------------------------
def generate_pdf():
    pdf_filename = "UNSEEN_Product_and_Technical_Showcase.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=70,
        bottomMargin=70
    )
    
    # Styles Setup
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    
    body_style = ParagraphStyle(
        'BodyWhite',
        parent=normal_style,
        textColor=COLOR_TEXT_MUTED,
        fontSize=9.5,
        leading=14.5,
        fontName='Helvetica'
    )
    
    bold_style = ParagraphStyle(
        'BodyBoldWhite',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=COLOR_TEXT
    )
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=normal_style,
        fontName='Helvetica-Bold',
        fontSize=42,
        leading=48,
        textColor=COLOR_TEXT,
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=normal_style,
        fontName='Helvetica',
        fontSize=13.5,
        leading=18,
        textColor=COLOR_SECONDARY,
        alignment=1
    )
    
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=normal_style,
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=COLOR_SECONDARY,
        spaceBefore=10,
        spaceAfter=15,
        keepWithNext=True
    )
    
    story = []
    
    # ─── PAGE 1 — COVER ──────────────────────────────────────────────────────
    story.append(Spacer(1, 60))
    if os.path.exists(IMAGE_PATHS["logo"]):
        story.append(Image(IMAGE_PATHS["logo"], width=64, height=64, hAlign='CENTER'))
        story.append(Spacer(1, 15))
        
    story.append(Paragraph("UNSEEN", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("A Social Platform for Sharing, Discovery and Connection", subtitle_style))
    story.append(Spacer(1, 10))
    
    sub_text_style = ParagraphStyle('SubText', parent=body_style, alignment=1, fontSize=10.5, textColor=COLOR_TEXT_MUTED)
    story.append(Paragraph("Responsive Web Platform + Android APK", sub_text_style))
    story.append(Spacer(1, 10))
    
    link_style = ParagraphStyle('Link', parent=body_style, alignment=1, fontSize=10, textColor=COLOR_SECONDARY)
    story.append(Paragraph("https://unseen-world.vercel.app/", link_style))
    story.append(Spacer(1, 20))
    
    # Badges Row
    badge_style = ParagraphStyle('Badge', parent=body_style, alignment=1, fontSize=9, textColor=COLOR_TEXT, fontName='Helvetica-Bold')
    badge_data = [[
        Paragraph("<font color='#A78BFA'>◆</font> Web Platform", badge_style),
        Paragraph("<font color='#A78BFA'>◆</font> Android APK", badge_style),
        Paragraph("<font color='#A78BFA'>◆</font> Social Platform", badge_style)
    ]]
    badge_table = Table(badge_data, colWidths=[156, 156, 156])
    badge_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('BOX', (0,0), (-1,-1), 0.75, COLOR_PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 30))
    
    # Large Premium Device Mockup (Home screenshot)
    home_browser = get_browser_frame(IMAGE_PATHS["home"], width=380, height=180)
    story.append(home_browser)
    
    story.append(Spacer(1, 45))
    author_style = ParagraphStyle('AuthorCover', parent=body_style, alignment=1, fontSize=10.5, textColor=COLOR_SECONDARY, fontName='Helvetica-Bold')
    story.append(Paragraph("Created by Krishnam Gupta", author_style))
    story.append(PageBreak())
    
    # ─── PAGE 2 — THE IDEA + PRODUCT VISION ──────────────────────────────────
    story.append(Paragraph("Why UNSEEN?", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>Product Definition & Vision:</b> UNSEEN is a modern, anonymous-first social ecosystem designed to solve the "
        "reputation and curation pressure of mainstream social platforms. In traditional networks, identity-bound profiles "
        "and public scoring generate sharing anxiety. UNSEEN dismantles these barriers by enforcing anonymity as a core protocol. "
        "The vision is to establish a safe, distraction-free environment for honest sharing, community connection, and mutual discovery.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Concept diagram
    story.append(Paragraph("<b>Vision Concept Flow:</b>", bold_style))
    story.append(Spacer(1, 6))
    story.append(make_concept_diagram(width=470, height=35))
    story.append(Spacer(1, 20))
    
    # 3 Large Cards side-by-side
    c1 = make_card("Share", "Publish raw thoughts, confessions, and feelings without revealing real identities, reducing curation pressure.", body_style, width=148)
    c2 = make_card("Discover", "Explore popular hashtags, search active topics, and view trending global discussions dynamically.", body_style, width=148)
    c3 = make_card("Connect", "Follow creator feeds, visit public profiles, and participate in threaded community replies safely.", body_style, width=148)
    
    t_cards = Table([[c1, c2, c3]], colWidths=[156, 156, 156])
    t_cards.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_cards)
    story.append(Spacer(1, 20))
    
    # Mockups side-by-side: Home (browser) and Login (phone)
    home_panel = get_browser_frame(IMAGE_PATHS["home"], width=230, height=110)
    login_panel = get_phone_frame(IMAGE_PATHS["login"], width=85, height=170)
    
    t_panels = Table([[home_panel, login_panel]], colWidths=[290, 180])
    t_panels.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_panels)
    story.append(PageBreak())
    
    # ─── PAGE 3 — USER EXPERIENCE JOURNEY ────────────────────────────────────
    story.append(Paragraph("From Opening the App to Joining Conversations", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>User Experience Journey & Onboarding PRD:</b> To maximize activation and trust, the onboarding journey "
        "enforces immediate, frictionless platform entry. The anonymity engine automatically generates a random persona "
        "on signup, pairing adjectives with nouns (e.g. 'silent-shadow-82'). Display names are customizable, and emails "
        "are stored securely strictly for optional password recovery. Users navigate from the intro gate directly to "
        "global conversations, keeping the barrier to entry extremely low.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Journey map side-by-side with Login phone mockup
    journey_map = make_vertical_journey_map(width=220, height=270)
    login_large = get_phone_frame(IMAGE_PATHS["login"], width=120, height=240)
    
    t_journey = Table([[journey_map, login_large]], colWidths=[250, 220])
    t_journey.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_journey)
    story.append(Spacer(1, 20))
    
    # User Value strip
    val_body_style = ParagraphStyle('ValBody', parent=body_style, alignment=1, fontSize=8.5, textColor=COLOR_TEXT_MUTED)
    
    val_strip_data = [
        [
            Paragraph("🚀 <b>Frictionless Entry</b><br/>No real identity checks during registration", val_body_style),
            Paragraph("🎯 <b>Intuitive Actions</b><br/>Simple buttons to like, save, or reply", val_body_style),
            Paragraph("🔍 <b>Social Discovery</b><br/>Search users, hashtags, and threads", val_body_style),
            Paragraph("📱 <b>Cross-Device</b><br/>Seamless mobile browser and APK wrappers", val_body_style)
        ]
    ]
    t_strip = Table(val_strip_data, colWidths=[117, 117, 117, 117])
    t_strip.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#2B1B54")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_strip)
    story.append(PageBreak())
    
    # ─── PAGE 4 — CORE PRODUCT EXPERIENCE ────────────────────────────────────
    story.append(Paragraph("Everything Users Need to Participate", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>Core Feature Specifications & Requirements:</b> The UNSEEN feed serves as the central hub of community interaction, "
        "integrating six core modules to support expression, safety, and interest tracking. Features are engineered to "
        "feel responsive and supportive, with content moderation tools enabling self-policing to protect community standards.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Large Feed screenshot (takes 50% height)
    feed_screenshot = get_browser_frame(IMAGE_PATHS["feed"], width=380, height=180)
    story.append(feed_screenshot)
    story.append(Spacer(1, 20))
    
    # Six callouts in 3 columns
    call_1 = make_card("📝 Create & Delete Posts", "Share thoughts or confessions easily. Post authors retain control to delete content.", body_style, width=148)
    call_2 = make_card("❤️ Like & Save", "Express appreciation and build a curated collection of saved posts inside profiles.", body_style, width=148)
    call_3 = make_card("💬 Comments & Replies", "Participate in threaded discussions with support for nested comments.", body_style, width=148)
    call_4 = make_card("👤 Follow / Unfollow", "Follow specific creators and construct customized feed experiences.", body_style, width=148)
    call_5 = make_card("🔍 Search & Trends", "Locate specific content, search active tags, and discover popular hashtags.", body_style, width=148)
    call_6 = make_card("🛡️ Report Tools", "Flag inappropriate content, maintaining a high-quality community space.", body_style, width=148)
    
    t_callouts = Table([[call_1, call_2, call_3], [call_4, call_5, call_6]], colWidths=[156, 156, 156])
    t_callouts.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_callouts)
    story.append(Spacer(1, 15))
    
    # Interaction map at bottom
    story.append(Paragraph("<b>Dynamic Engagement Pipeline:</b>", bold_style))
    story.append(Spacer(1, 6))
    story.append(make_interaction_map(width=470, height=22))
    story.append(PageBreak())
    
    # ─── PAGE 5 — WEB + ANDROID APK ──────────────────────────────────────────
    story.append(Paragraph("One Product, Multiple Ways to Access It", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>Cross-Platform Access Channels:</b> To maximize community reach, UNSEEN is deployed across responsive web "
        "and native-wrapped Android APK channels. Both platforms connect to the same real-time backend API database, "
        "ensuring a synchronized, consistent social experience regardless of the user's access method.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Two columns layout
    web_para = Paragraph(
        "<b><font color='#A78BFA'>🌐 Responsive Web Experience</font></b><br/>"
        "• Access instantly from any browser without installation.<br/>"
        "• Fluid layouts collapse from desktop columns to slim mobile screens.<br/>"
        "• Public pages load efficiently, enabling easy link sharing.<br/>"
        "• Flexible UI styling adapts dynamically to client devices.",
        body_style
    )
    apk_para = Paragraph(
        "<b><font color='#A78BFA'>📱 Android WebView APK Wrapper</font></b><br/>"
        "• Installs onto home-screen with native launcher icons.<br/>"
        "• Implements WebView controllers to wrap responsive web pages.<br/>"
        "• Fullscreen orientation hides address bars for an app-like experience.<br/>"
        "• Convenient, quick-tap platform access for mobile devices.",
        body_style
    )
    
    t_cols = Table([[web_para, apk_para]], colWidths=[225, 225])
    t_cols.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), COLOR_DARK_CARD),
        ('BACKGROUND', (1,0), (1,0), COLOR_DARK_CARD),
        ('BOX', (0,0), (0,0), 0.75, COLOR_PRIMARY),
        ('BOX', (1,0), (1,0), 0.75, COLOR_PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_cols)
    story.append(Spacer(1, 15))
    
    # Center text indicator
    story.append(make_center_flow_drawing(width=470, height=30))
    story.append(Spacer(1, 15))
    
    # Side-by-side mockups
    dl_mock = get_browser_frame(IMAGE_PATHS["download"], width=225, height=115)
    home_mock_small = get_browser_frame(IMAGE_PATHS["home"], width=225, height=115)
    
    t_web_apk_panels = Table([[dl_mock, home_mock_small]], colWidths=[240, 240])
    t_web_apk_panels.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_web_apk_panels)
    story.append(PageBreak())
    
    # ─── PAGE 6 — DESIGN SYSTEM + RESPONSIVENESS ──────────────────────────────
    story.append(Paragraph("Built for Desktop and Mobile", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>Design System & UI Responsiveness:</b> The interface is built on a custom design system centered around "
        "cyber-dark aesthetics, deep violet borders, and lavender typography highlights. Key layout components resize "
        "and collapse dynamically, adapting visual grids and navigation elements to the screen's dimensions.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # device progression
    story.append(make_device_progression(width=470, height=22))
    story.append(Spacer(1, 15))
    
    # 4 small screenshots grid
    sc_home = get_browser_frame(IMAGE_PATHS["home"], width=160, height=85)
    sc_feed = get_browser_frame(IMAGE_PATHS["feed"], width=160, height=85)
    sc_profile = get_browser_frame(IMAGE_PATHS["profile"], width=160, height=85)
    sc_download = get_browser_frame(IMAGE_PATHS["download"], width=160, height=85)
    
    t_sc_grid = Table([[sc_home, sc_feed], [sc_profile, sc_download]], colWidths=[235, 235])
    t_sc_grid.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_sc_grid)
    story.append(Spacer(1, 15))
    
    # 4 design principle cards in 2x2 grid
    dp_1 = make_card("Clear Navigation", "Familiar bottom bars, sidebar labels, and action tags maintain usability.", body_style, width=225)
    dp_2 = make_card("Responsive Layouts", "Columns compress, overlays collapse, and margins scale for compact screens.", body_style, width=225)
    dp_3 = make_card("Consistent Visuals", "A curated palette of dark violet, indigo accents, and clean text creates a premium theme.", body_style, width=225)
    dp_4 = make_card("Focused Interaction", "Secondary elements collapse on smaller screens, keeping post feeds central.", body_style, width=225)
    
    t_dp_grid = Table([[dp_1, dp_2], [dp_3, dp_4]], colWidths=[235, 235])
    t_dp_grid.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_dp_grid)
    story.append(PageBreak())
    
    # ─── PAGE 7 — LIVE SOCIAL INTERACTION ────────────────────────────────────
    story.append(Paragraph("Keeping Social Activity Connected", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "<b>Real-Time Event Processing & Socket loops:</b> Anonymity should not feel isolated. To keep the platform alive, "
        "UNSEEN integrates real-time WebSocket pipelines. User actions, message transmissions, comment feeds, and profile counts "
        "propagate across active clients automatically, providing responsive feedback loops without manual reload stutters.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # flow diagram
    story.append(make_live_event_flow(width=470, height=35))
    story.append(Spacer(1, 15))
    
    # 4 cards
    rt_1 = make_card("Like & Save Activity", "Fires optimistic state changes, updating interaction counts and flags instantly in UI.", body_style, width=225)
    rt_2 = make_card("Comments & Replies", "Pushes new text responses directly into open conversation cards in real time.", body_style, width=225)
    rt_3 = make_card("Follow Updates", "Synchronizes follower and following counts on user profiles, resolving discrepancies.", body_style, width=225)
    rt_4 = make_card("Notification Indicators", "Triggers navigation alert badges across active devices, indicating fresh events.", body_style, width=225)
    
    t_rt_grid = Table([[rt_1, rt_2], [rt_3, rt_4]], colWidths=[235, 235])
    t_rt_grid.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_rt_grid)
    story.append(Spacer(1, 15))
    
    # Feed & Profile screenshots supporting panels
    panel_feed = get_browser_frame(IMAGE_PATHS["feed"], width=210, height=105)
    panel_profile = get_browser_frame(IMAGE_PATHS["profile"], width=210, height=105)
    
    t_rt_panels = Table([[panel_feed, panel_profile]], colWidths=[235, 235])
    t_rt_panels.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_rt_panels)
    story.append(PageBreak())
    
    # ─── PAGE 8 — TECHNOLOGY, SECURITY + DATA FLOW ───────────────────────────
    story.append(Paragraph("Technology Behind the Experience", h1_style))
    story.append(Spacer(1, 8))
    
    # Zone 1 - Tech Stack (6 cards)
    story.append(Paragraph("<b>Zone 1: Core Technology Stack</b>", bold_style))
    story.append(Spacer(1, 6))
    
    ts_1 = make_card("Frontend Interface", "React.js / Next.js wrapper structures with responsive Tailwind styling.", body_style, width=148)
    ts_2 = make_card("Backend API Router", "Node.js / Express server handlers routing requests securely.", body_style, width=148)
    ts_3 = make_card("Data Persistence", "MongoDB Atlas storing accounts, posts, and messaging logs.", body_style, width=148)
    ts_4 = make_card("Live Synchronization", "Socket.IO WebSockets syncing user counts and notification indicators.", body_style, width=148)
    ts_5 = make_card("Hosting Targets", "Vercel static client CDN, Render container instances.", body_style, width=148)
    ts_6 = make_card("Android Client WebView", "Android Studio WebView layout compilation inside APK bundle wrapper.", body_style, width=148)
    
    t_tech_cards = Table([[ts_1, ts_2, ts_3], [ts_4, ts_5, ts_6]], colWidths=[156, 156, 156])
    t_tech_cards.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_tech_cards)
    story.append(Spacer(1, 15))
    
    # Zone 2 - Architecture Flow
    story.append(Paragraph("<b>Zone 2: Decoupled System Architecture</b>", bold_style))
    story.append(Spacer(1, 6))
    story.append(make_arch_flow(width=470, height=24))
    story.append(Spacer(1, 15))
    
    # Zone 3 - Security Flow
    story.append(Paragraph("<b>Zone 3: Safe Credentials & Session Flow</b>", bold_style))
    story.append(Spacer(1, 6))
    story.append(make_security_flow(width=470, height=24))
    story.append(Spacer(1, 12))
    
    sec_1 = make_card("HTTPS/TLS Protection", "Encrypts client-server requests, securing all data in transit.", body_style, width=225)
    sec_2 = make_card("Secure Password Storage", "Salt-hashes user password entries via bcrypt before storage.", body_style, width=225)
    sec_3 = make_card("Authenticated Session", "Grants ephemeral, signed JWT access tokens during account sign-in.", body_style, width=225)
    sec_4 = make_card("Protected API Routes", "Validates user tokens via backend interceptors, blocking unauthorized edits.", body_style, width=225)
    
    t_sec_cards = Table([[sec_1, sec_2], [sec_3, sec_4]], colWidths=[235, 235])
    t_sec_cards.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_sec_cards)
    story.append(PageBreak())
    
    # ─── PAGE 9 — BUILD STORY + LEARNINGS ────────────────────────────────────
    story.append(Paragraph("From Idea to Live Product", h1_style))
    story.append(Spacer(1, 8))
    
    # Timeline
    story.append(Paragraph("<b>Project Build Progression:</b>", bold_style))
    story.append(Spacer(1, 6))
    story.append(make_build_timeline(width=470, height=22))
    story.append(Spacer(1, 20))
    
    # Two columns for What I Worked On and AI Assistant Note
    worked_on_para = Paragraph(
        "<b><font color='#A78BFA'>💡 What I Worked On</font></b><br/><br/>"
        "• <b>Product Requirements:</b> Drafted specifications, scope limits, and feature lists.<br/>"
        "• <b>Feature Planning:</b> Structured authentication screens, user feeds, and profiles.<br/>"
        "• <b>UI & UX Design:</b> Configured responsive viewports and dark cyber purple theme accents.<br/>"
        "• <b>Multi-Device Testing:</b> Validated layout behaviors on desktop browsers & mobile wraps.<br/>"
        "• <b>Issue Iterations:</b> Identified visual bugs and refined responsive layouts.<br/>"
        "• <b>Deployment:</b> Configured hosting setups and prepared release APK files.<br/><br/>"
        "<b>🔮 Future Enhancements & Scope:</b><br/>"
        "• <b>Voice Confessions:</b> Add audio snippets with dynamic voice filters.<br/>"
        "• <b>AI Moderation:</b> Classification models to automatically flag abusive logs.<br/>"
        "• <b>Community Spaces:</b> Group confessions by interest (e.g. mental health, career advice).",
        body_style
    )
    
    note_content = (
        "UNSEEN was developed with Antigravity as an AI development assistant. "
        "I guided the product direction, feature requirements, testing, UX decisions, "
        "issue reporting, iterative improvements, and deployment."
    )
    note_card = make_callout(note_content, title="DEVELOPMENT ASSISTANCE NOTE", body_style=body_style, width=215)
    
    author_card = make_card(
        "Project Director Profile",
        "Project Direction, Product Decisions, Testing & Deployment — Krishnam Gupta",
        body_style,
        width=215
    )
    
    right_table = Table([[note_card], [Spacer(1, 12)], [author_card]], colWidths=[225])
    right_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    t_build_cols = Table([[worked_on_para, right_table]], colWidths=[235, 235])
    t_build_cols.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_build_cols)
    story.append(PageBreak())
    
    # ─── PAGE 10 — SCREENSHOT GALLERY + FINAL CTA ────────────────────────────
    story.append(Paragraph("Explore UNSEEN", h1_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(
        "Review the actual UI layouts and experiences crafted across responsive web browser wrappers and Android APK wrappers.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Masonry gallery (resized to fit the page and prevent overflow)
    gal_1 = get_browser_frame(IMAGE_PATHS["home"], width=135, height=65)
    gal_2 = get_browser_frame(IMAGE_PATHS["feed"], width=135, height=65)
    gal_3 = get_browser_frame(IMAGE_PATHS["profile"], width=135, height=65)
    gal_4 = get_browser_frame(IMAGE_PATHS["download"], width=150, height=75)
    gal_5 = get_phone_frame(IMAGE_PATHS["login"], width=75, height=135)
    
    # Row 1: Home, Feed, Profile (browser frames)
    t_gal_row1 = Table([[gal_1, gal_2, gal_3]], colWidths=[156, 156, 156])
    t_gal_row1.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    # Row 2 contains download frame and login phone frame
    t_gal_row2 = Table([[gal_4, gal_5]], colWidths=[250, 220])
    t_gal_row2.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    story.append(t_gal_row1)
    story.append(Spacer(1, 8))
    story.append(t_gal_row2)
    story.append(Spacer(1, 10))
    
    # Call to action block (expanded padding)
    cta_title_style = ParagraphStyle('CTATitle', parent=normal_style, fontName='Helvetica-Bold', fontSize=15, leading=19, textColor=COLOR_TEXT, alignment=1)
    cta_body_style = ParagraphStyle('CTABody', parent=body_style, alignment=1, fontSize=9.5, textColor=COLOR_TEXT_MUTED)
    cta_link_style = ParagraphStyle('CTALink', parent=body_style, alignment=1, fontSize=12, textColor=COLOR_SECONDARY, fontName='Helvetica-Bold')
    
    cta_content = [
        [Paragraph("⚡ Explore UNSEEN Live", cta_title_style)],
        [Spacer(1, 2)],
        [Paragraph("Visit the platform directly to share thoughts, explore trending topics, and view anonymous feeds.", cta_body_style)],
        [Spacer(1, 5)],
        [Paragraph("https://unseen-world.vercel.app/", cta_link_style)],
        [Spacer(1, 5)],
        [Paragraph("Feedback, reviews, and suggestions are welcome.", cta_body_style)],
        [Spacer(1, 15)],
        [Paragraph("Built and presented by Krishnam Gupta", ParagraphStyle('CTABuilder', parent=body_style, alignment=1, fontSize=9, textColor=COLOR_SECONDARY, fontName='Helvetica-Bold'))]
    ]
    t_cta = Table(cta_content, colWidths=[470])
    t_cta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('BOX', (0,0), (-1,-1), 0.75, COLOR_PRIMARY),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_cta)
    
    # Build Document
    doc.build(story, onFirstPage=draw_page_decorations, onLaterPages=draw_page_decorations)
    print("PDF generation completed successfully!")

if __name__ == "__main__":
    generate_pdf()

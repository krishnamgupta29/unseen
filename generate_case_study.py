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
COLOR_MUTED = colors.HexColor("#6B7280")      # Muted gray for small prints
COLOR_TEXT = colors.HexColor("#FFFFFF")       # White body text
COLOR_TEXT_MUTED = colors.HexColor("#D1D5DB") # Off-white text

# Paths to the user uploaded assets (located in brain directory)
BRAIN_DIR = "C:/Users/krish/.gemini/antigravity-ide/brain/3df3f54f-c0ea-499c-9c45-6e8da96439ff"
IMAGE_PATHS = {
    "landing": f"{BRAIN_DIR}/media__1782056139625.png",
    "feed": f"{BRAIN_DIR}/media__1782056139917.png",
    "profile": f"{BRAIN_DIR}/media__1782056139817.png",
    "download": f"{BRAIN_DIR}/media__1782056144076.png",
    "mobile": f"{BRAIN_DIR}/media__1782056154896.jpg",
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
    canvas_obj.setFillColor(colors.HexColor("#1B0E3C"))
    canvas_obj.circle(0, 0, 320, fill=True, stroke=False)
    canvas_obj.circle(doc.pagesize[0], doc.pagesize[1], 220, fill=True, stroke=False)
    
    # Draw page numbers & running header (except cover page)
    if doc.page > 1:
        # Running Header
        canvas_obj.setFont("Helvetica-Bold", 8)
        canvas_obj.setFillColor(COLOR_SECONDARY)
        canvas_obj.drawString(54, doc.pagesize[1] - 36, "UNSEEN")
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(COLOR_TEXT_MUTED)
        canvas_obj.drawString(100, doc.pagesize[1] - 36, "|   Public Project Case Study")
        canvas_obj.setStrokeColor(colors.HexColor("#2B1B54"))
        canvas_obj.setLineWidth(1)
        canvas_obj.line(54, doc.pagesize[1] - 44, doc.pagesize[0] - 54, doc.pagesize[1] - 44)
        
        # Running Footer
        canvas_obj.setFont("Helvetica", 9)
        canvas_obj.setFillColor(COLOR_SECONDARY)
        canvas_obj.drawRightString(doc.pagesize[0] - 54, 30, f"Page {doc.page} of 12")
        canvas_obj.drawString(54, 30, "UNSEEN — Web Platform + Android APK")
        canvas_obj.line(54, 42, doc.pagesize[0] - 54, 42)
        
    canvas_obj.restoreState()

# ---------------------------------------------------------
# DIAGRAM GENERATORS (ReportLab Drawings)
# ---------------------------------------------------------
def make_flow_diagram(steps, width=460, height=50):
    d = Drawing(width, height)
    num_steps = len(steps)
    step_width = 65
    step_height = 24
    spacing = (width - (num_steps * step_width)) / (num_steps - 1)
    
    for i, step in enumerate(steps):
        x = i * (step_width + spacing)
        y = (height - step_height) / 2
        # draw node box
        d.add(Rect(x, y, step_width, step_height, rx=5, ry=5, 
                   fillColor=COLOR_DARK_CARD, 
                   strokeColor=COLOR_PRIMARY, strokeWidth=1))
        # draw text
        d.add(String(x + step_width/2, y + 8, step, textAnchor="middle",
                     fontName="Helvetica-Bold", fontSize=7.5, fillColor=COLOR_TEXT))
        # draw arrow to next
        if i < num_steps - 1:
            arrow_x_start = x + step_width
            arrow_x_end = arrow_x_start + spacing
            arrow_y = y + step_height/2
            d.add(Line(arrow_x_start, arrow_y, arrow_x_end, arrow_y, 
                       strokeColor=COLOR_SECONDARY, strokeWidth=1.5))
            d.add(Polygon([arrow_x_end, arrow_y, arrow_x_end - 4, arrow_y + 3, arrow_x_end - 4, arrow_y - 3], 
                          fillColor=COLOR_SECONDARY, strokeColor=COLOR_SECONDARY))
    return d

def make_technology_diagram(width=460, height=70):
    d = Drawing(width, height)
    categories = ["Frontend", "Backend", "Database", "Real-Time", "Deployment", "Android"]
    num_cats = len(categories)
    box_width = 65
    box_height = 30
    spacing = (width - (num_cats * box_width)) / (num_cats - 1)
    
    for i, cat in enumerate(categories):
        x = i * (box_width + spacing)
        y = (height - box_height) / 2
        d.add(Rect(x, y, box_width, box_height, rx=4, ry=4, 
                   fillColor=colors.HexColor("#2B1B54"), 
                   strokeColor=COLOR_SECONDARY, strokeWidth=1))
        d.add(String(x + box_width/2, y + 10, cat, textAnchor="middle",
                     fontName="Helvetica-Bold", fontSize=8, fillColor=COLOR_TEXT))
        
        # Connectors representing a unified network
        if i < num_cats - 1:
            cx_start = x + box_width
            cx_end = cx_start + spacing
            cy = y + box_height/2
            d.add(Line(cx_start, cy, cx_end, cy, strokeColor=colors.HexColor("#4F46E5"), strokeWidth=1, strokeDashArray=[2,2]))
            
    return d

def make_qr_code_drawing(size=80):
    d = Drawing(size, size)
    d.add(Rect(0, 0, size, size, fillColor=colors.white, strokeColor=COLOR_PRIMARY, strokeWidth=1.5))
    
    # Finder patterns
    d.add(Rect(4, size - 24, 20, 20, fillColor=colors.black, strokeColor=None))
    d.add(Rect(7, size - 21, 14, 14, fillColor=colors.white, strokeColor=None))
    d.add(Rect(10, size - 18, 8, 8, fillColor=colors.black, strokeColor=None))
    
    d.add(Rect(size - 24, size - 24, 20, 20, fillColor=colors.black, strokeColor=None))
    d.add(Rect(size - 21, size - 21, 14, 14, fillColor=colors.white, strokeColor=None))
    d.add(Rect(size - 18, size - 18, 8, 8, fillColor=colors.black, strokeColor=None))
    
    d.add(Rect(4, 4, 20, 20, fillColor=colors.black, strokeColor=None))
    d.add(Rect(7, 7, 14, 14, fillColor=colors.white, strokeColor=None))
    d.add(Rect(10, 10, 8, 8, fillColor=colors.black, strokeColor=None))
    
    import random
    random.seed(99) # deterministic
    cell_size = 4
    for x in range(0, size, cell_size):
        for y in range(0, size, cell_size):
            if x < 28 and y > size - 28: continue
            if x > size - 28 and y > size - 28: continue
            if x < 28 and y < 28: continue
            if random.choice([True, False]):
                d.add(Rect(x, y, cell_size, cell_size, fillColor=colors.black, strokeColor=None))
                
    return d

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
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
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
    header_para = Paragraph("📱 UNSEEN MOBILE &nbsp;&nbsp;&nbsp;&nbsp; 🔋 98%", header_style)
    
    img = Image(image_path, width=width, height=height)
    
    t = Table([[header_para], [img]], colWidths=[width + 8])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,1), (-1,1), COLOR_BG),
        ('BOX', (0,0), (-1,-1), 2, COLOR_PRIMARY),
    ]))
    return t

# ---------------------------------------------------------
# CONTAINER BLOCKS
# ---------------------------------------------------------
def make_callout(text, title="PROJECT GOAL", bold_style=None, body_style=None):
    table = Table([[Paragraph(f"<b>{title}</b><br/>{text}", body_style)]], colWidths=[460])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LINELEFT', (0,0), (-1,-1), 3.0, COLOR_PRIMARY),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
    ]))
    return table

def make_card(title, text, bold_style=None, body_style=None, width=220):
    content = Paragraph(f"<b><font color='#A78BFA'>{title}</font></b><br/>{text}", body_style)
    table = Table([[content]], colWidths=[width])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_DARK_CARD),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
    ]))
    return table

# ---------------------------------------------------------
# MAIN PDF COMPILATION
# ---------------------------------------------------------
def generate_pdf():
    # Setup document
    pdf_filename = "UNSEEN_Public_Project_Case_Study.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54, # 0.75 inch
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    # Styles
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    
    body_style = ParagraphStyle(
        'BodyWhite',
        parent=normal_style,
        textColor=COLOR_TEXT_MUTED,
        fontSize=9.5,
        leading=14,
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
        fontSize=32,
        leading=38,
        textColor=COLOR_TEXT,
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=normal_style,
        fontName='Helvetica',
        fontSize=13,
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
    story.append(Spacer(1, 120))
    if os.path.exists(IMAGE_PATHS["logo"]):
        story.append(Image(IMAGE_PATHS["logo"], width=72, height=72, hAlign='CENTER'))
        story.append(Spacer(1, 15))
        
    story.append(Paragraph("UNSEEN", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<i>A Privacy-Focused Social Platform</i>", subtitle_style))
    story.append(Spacer(1, 12))
    
    sub_text_style = ParagraphStyle('SubText', parent=body_style, alignment=1, fontSize=10.5, textColor=COLOR_TEXT_MUTED)
    story.append(Paragraph("Web Platform + Android APK", sub_text_style))
    story.append(Spacer(1, 18))
    
    link_style = ParagraphStyle('Link', parent=body_style, alignment=1, fontSize=10, textColor=COLOR_SECONDARY)
    story.append(Paragraph("Live Website: <u>https://unseen-world.vercel.app/</u>", link_style))
    
    # Graphic decoration using spacer
    story.append(Spacer(1, 150))
    
    meta_style = ParagraphStyle('Meta', parent=body_style, alignment=1, fontSize=9, textColor=colors.HexColor("#8B5CF6"))
    story.append(Paragraph("Public Portfolio Case Study &nbsp;•&nbsp; 2026 Edition", meta_style))
    story.append(PageBreak())
    
    # ─── PAGE 2 — EXECUTIVE SUMMARY ──────────────────────────────────────────
    story.append(Paragraph("Project Overview", h1_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "UNSEEN is a privacy-focused social platform built for sharing thoughts, discovering conversations, "
        "and connecting with others through a modern, responsive experience. Traditional social networks "
        "rely heavily on tracking identities, curation pressure, and public profiles. UNSEEN shifts the paradigm "
        "by prioritizing authentic, anonymous-first interactions in a high-fidelity visual workspace.",
        body_style
    ))
    story.append(Spacer(1, 20))
    
    # Summary Table
    table_data = [
        [Paragraph("<b>Area</b>", bold_style), Paragraph("<b>Description</b>", bold_style)],
        [Paragraph("Product", bold_style), Paragraph("Privacy-focused anonymous social platform", body_style)],
        [Paragraph("Platforms", bold_style), Paragraph("Responsive website + Android APK Client", body_style)],
        [Paragraph("Focus", bold_style), Paragraph("Real-time interactions, usability, and consistent mobile wrappers", body_style)],
    ]
    t1 = Table(table_data, colWidths=[100, 360])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t1)
    story.append(Spacer(1, 30))
    
    # Project Goal Callout
    story.append(make_callout(
        "Build a modern social platform that feels intuitive, responsive, and consistent across web browsers and Android devices.",
        title="PROJECT GOAL", bold_style=bold_style, body_style=body_style
    ))
    story.append(PageBreak())
    
    # ─── PAGE 3 — PRODUCT EXPERIENCE MAP ──────────────────────────────────────
    story.append(Paragraph("How Users Experience UNSEEN", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "The UNSEEN user journey is designed to be frictionless, transitioning users instantly from "
        "onboarding to active engagement. The flows protect identities by generating random "
        "adjective-noun combinations during account activation.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Journey Diagram 1
    story.append(Paragraph("<b>Primary User Journey Flow:</b>", bold_style))
    story.append(Spacer(1, 5))
    story.append(make_flow_diagram(["Open App", "Intro Gate", "Signup / In", "Home Feed", "Interact", "Profile"], width=460, height=45))
    story.append(Spacer(1, 25))
    
    # Journey Diagram 2
    story.append(Paragraph("<b>Feed Interaction Lifecycle:</b>", bold_style))
    story.append(Spacer(1, 5))
    story.append(make_flow_diagram(["Create Post", "Feed Push", "Likes/Saves", "Notifications", "Engagement", "Real-Time Sync"], width=460, height=45))
    
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "This architectural flow isolates client-side presentation states from personal database keys, "
        "ensuring that your public feed experiences remain safe, highly interactive, and completely decoupled "
        "from real-world identities.",
        body_style
    ))
    story.append(PageBreak())
    
    # ─── PAGE 4 — CORE FEATURES ──────────────────────────────────────────────
    story.append(Paragraph("Core Social Features", h1_style))
    story.append(Spacer(1, 10))
    
    # Feature Matrix Table
    matrix_data = [
        [Paragraph("<b>Feature</b>", bold_style), Paragraph("<b>User Value</b>", bold_style), Paragraph("<b>Availability</b>", bold_style)],
        [Paragraph("Create & Delete Posts", bold_style), Paragraph("Share confessions and thoughts easily", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Likes & Saved Posts", bold_style), Paragraph("Engage with feed content and compile collections", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Comments & Replies", bold_style), Paragraph("Participate in threaded discussions", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Follow / Unfollow", bold_style), Paragraph("Build networks and personal following feeds", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Search & Trends", bold_style), Paragraph("Discover popular conversations and hashtags", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Report Tools", bold_style), Paragraph("Flag inappropriate posts to keep safety high", body_style), Paragraph("Web + APK", body_style)],
        [Paragraph("Responsive Design", bold_style), Paragraph("Adapts smoothly to desktop, tablets, and phones", body_style), Paragraph("Web + APK", body_style)],
    ]
    t2 = Table(matrix_data, colWidths=[130, 230, 100])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t2)
    story.append(Spacer(1, 20))
    
    # Feature Cards (2x3 Grid)
    card1 = make_card("📝 Create Post", "Publish text confessions under an automatically assigned alias name.", body_style=body_style, width=220)
    card2 = make_card("💬 Comment Threads", "Reply directly to posts with nested conversations.", body_style=body_style, width=220)
    card3 = make_card("🔥 Hashtags", "Tag posts with mood labels (e.g. #mood) to group feeds.", body_style=body_style, width=220)
    card4 = make_card("🛡️ Report Posts", "Flag inappropriate content. Posts with 5+ reports are hidden.", body_style=body_style, width=220)
    
    t_cards = Table([[card1, card2], [card3, card4]], colWidths=[230, 230])
    t_cards.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_cards)
    story.append(PageBreak())
    
    # ─── PAGE 5 — REAL-TIME EXPERIENCE ───────────────────────────────────────
    story.append(Paragraph("Designed for Live Interaction", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "UNSEEN handles real-time data flows to create a highly responsive social loop. "
        "Rather than relying on manual page reloads, the platform syncs counts and new activities "
        "smoothly in the background.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Real-Time Diagram
    story.append(make_flow_diagram(["User Action", "Immediate UI Feedback", "Background Sync", "Updated Feed State"], width=460, height=40))
    story.append(Spacer(1, 20))
    
    # Four Cards
    rt_card1 = make_card("⚡ Live Feed Updates", "New posts appear at the top of the feed smoothly when near top, or show a non-intrusive banner.", body_style=body_style, width=220)
    rt_card2 = make_card("❤️ Fast Likes & Saves", "Interactions update counts in the store instantly, resolving state discrepancies cleanly.", body_style=body_style, width=220)
    rt_card3 = make_card("💬 Live Comments", "Conversations update automatically as new replies are published on the backend server.", body_style=body_style, width=220)
    rt_card4 = make_card("🔔 Badge Synchronization", "Messages and notification badges synchronize across active devices instantly.", body_style=body_style, width=220)
    
    t_rt_cards = Table([[rt_card1, rt_card2], [rt_card3, rt_card4]], colWidths=[230, 230])
    t_rt_cards.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_rt_cards)
    story.append(Spacer(1, 15))
    
    # Comparison table
    comp_data = [
        [Paragraph("<b>Experience Area</b>", bold_style), Paragraph("<b>Traditional Refresh-Based UI</b>", bold_style), Paragraph("<b>UNSEEN Approach</b>", bold_style)],
        [Paragraph("New Activity", bold_style), Paragraph("Manual pull-to-refresh required", body_style), Paragraph("Updates appear automatically", body_style)],
        [Paragraph("Likes & Saves", bold_style), Paragraph("Delayed visual feedback", body_style), Paragraph("Immediate visual response (Optimistic)", body_style)],
        [Paragraph("Comments & Feeds", bold_style), Paragraph("Static until page reload", body_style), Paragraph("Background synchronization", body_style)]
    ]
    t3 = Table(comp_data, colWidths=[120, 170, 170])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t3)
    story.append(PageBreak())
    
    # ─── PAGE 6 — PRIVACY & SAFETY ───────────────────────────────────────────
    story.append(Paragraph("Privacy-Focused by Design", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Privacy is not an afterthought in UNSEEN; it is the platform's core architecture. "
        "User sessions, credentials, and social connections are decoupled from real-world identifiers, "
        "encouraging authentic yet responsible sharing.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Privacy Diagram
    story.append(make_flow_diagram(["Account Access", "Protected User Experience", "Controlled Social Interactions"], width=460, height=40))
    story.append(Spacer(1, 20))
    
    # Privacy Cards
    pr_card1 = make_card("🔒 Protected Account Access", "Secure account creation with optional email recovery to protect personal information.", body_style=body_style, width=220)
    pr_card2 = make_card("⚖️ Terms & Policies", "Clear guidelines and Terms of Service govern platform interactions from the ground up.", body_style=body_style, width=220)
    pr_card3 = make_card("🛡️ Content Moderation Tools", "Users can report inappropriate content. Auto-flagging keeps the feed clean.", body_style=body_style, width=220)
    pr_card4 = make_card("👤 Controlled Social Options", "Users control who they follow, what they save, and what they share in their profile.", body_style=body_style, width=220)
    
    t_pr_cards = Table([[pr_card1, pr_card2], [pr_card3, pr_card4]], colWidths=[230, 230])
    t_pr_cards.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_pr_cards)
    story.append(Spacer(1, 25))
    
    story.append(make_callout(
        "UNSEEN is designed to encourage responsible social interaction while keeping privacy and user control central to the experience.",
        title="PRIVACY MANIFESTO", bold_style=bold_style, body_style=body_style
    ))
    story.append(PageBreak())
    
    # ─── PAGE 7 — WEB AND ANDROID APK ────────────────────────────────────────
    story.append(Paragraph("One Platform, Multiple Experiences", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "The UNSEEN experience adapts perfectly to your environment. Whether accessed via a desktop "
        "web browser or installed as a native Android APK wrapper, layout structures, real-time "
        "listeners, and asset scaling remain highly aligned.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Web vs APK comparison table
    web_apk_data = [
        [Paragraph("<b>Responsive Web Platform</b>", bold_style), Paragraph("<b>Android APK Client</b>", bold_style)],
        [Paragraph("Desktop and mobile browser access", body_style), Paragraph("App-like mobile experience", body_style)],
        [Paragraph("Responsive fluid layouts", body_style), Paragraph("Native app launcher icon and splash flow", body_style)],
        [Paragraph("Easy access via a link", body_style), Paragraph("Convenient home-screen access", body_style)],
        [Paragraph("Discoverable through search optimization", body_style), Paragraph("Designed for Android devices", body_style)]
    ]
    t4 = Table(web_apk_data, colWidths=[230, 230])
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), COLOR_PRIMARY),
        ('BACKGROUND', (1,0), (1,0), COLOR_SECONDARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t4)
    story.append(Spacer(1, 20))
    
    # Embedded screenshots comparison
    web_screenshot = get_browser_frame(IMAGE_PATHS["landing"], width=230, height=130)
    apk_screenshot = get_phone_frame(IMAGE_PATHS["mobile"], width=100, height=180)
    
    t_preview = Table([[web_screenshot, apk_screenshot]], colWidths=[280, 180])
    t_preview.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_preview)
    story.append(PageBreak())
    
    # ─── PAGE 8 — TECHNOLOGY OVERVIEW ────────────────────────────────────────
    story.append(Paragraph("Technology Overview", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "The UNSEEN ecosystem consists of modular backend API routers, connection gateways, "
        "and client interfaces. By leveraging standard, modern web technologies, "
        "the architecture ensures fast response times and stable data synchronization.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Tech Category Diagram
    story.append(make_technology_diagram(width=460, height=50))
    story.append(Spacer(1, 25))
    
    # Technology Table
    tech_data = [
        [Paragraph("<b>Layer</b>", bold_style), Paragraph("<b>Technology Used</b>", bold_style), Paragraph("<b>Description</b>", bold_style)],
        [Paragraph("Frontend", bold_style), Paragraph("React.js, Next.js, Tailwind CSS", body_style), Paragraph("Modern web component layouts with responsive scaling", body_style)],
        [Paragraph("Backend", bold_style), Paragraph("Node.js, Express.js", body_style), Paragraph("Lightweight, modular REST API services", body_style)],
        [Paragraph("Database", bold_style), Paragraph("MongoDB, Mongoose ORM", body_style), Paragraph("Document-based storage schemas with indexes", body_style)],
        [Paragraph("Real-Time", bold_style), Paragraph("Socket.io (WebSockets)", body_style), Paragraph("Bi-directional, low-latency client communication", body_style)],
        [Paragraph("Deployment", bold_style), Paragraph("Vercel & Render hosting", body_style), Paragraph("Automated deployment with SSL and custom routing", body_style)],
        [Paragraph("Android Client", bold_style), Paragraph("Android SDK, Kotlin WebView", body_style), Paragraph("Native-like wrapper with adaptive launcher support", body_style)]
    ]
    t5 = Table(tech_data, colWidths=[100, 160, 200])
    t5.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t5)
    story.append(PageBreak())
    
    # ─── PAGE 9 — DESIGN AND RESPONSIVENESS ──────────────────────────────────
    story.append(Paragraph("Responsive Design System", h1_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "UNSEEN was built from the ground up with a mobile-first philosophy. "
        "The user interface handles screen changes, aligning grid lists, "
        "collapsing sidebar navigations, and resizing content fields smoothly.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Responsive comparison diagram
    story.append(make_flow_diagram(["Desktop", "Tablet", "Mobile Screen", "Android APK wrapper"], width=460, height=40))
    story.append(Spacer(1, 20))
    
    # Image mockups
    d_scr = get_browser_frame(IMAGE_PATHS["feed"], width=230, height=130)
    m_scr = get_phone_frame(IMAGE_PATHS["mobile"], width=100, height=180)
    
    t_resp = Table([[d_scr, m_scr]], colWidths=[280, 180])
    t_resp.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_resp)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph(
        "The interface was refined for readable layouts, clear actions, and consistent interaction across different screen sizes.",
        body_style
    ))
    story.append(PageBreak())
    
    # ─── PAGE 10 — BUILD PROCESS ─────────────────────────────────────────────
    story.append(Paragraph("From Idea to Deployment", h1_style))
    story.append(Spacer(1, 10))
    
    # Timeline
    story.append(Paragraph("<b>Development Timeline:</b>", bold_style))
    story.append(Spacer(1, 5))
    story.append(make_flow_diagram(["Idea", "UI Planning", "Features", "Testing", "Bug Fixes", "Deploy", "APK Build"], width=460, height=40))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>Development Approach:</b>", bold_style))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "UNSEEN was developed with the support of Antigravity as an AI development assistant. "
        "I directed the product requirements, selected features, tested the experience, "
        "identified issues, made UX decisions, and managed iterative improvements and deployment.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Lessons learned table
    lessons_data = [
        [Paragraph("<b>Learning Area</b>", bold_style), Paragraph("<b>Key Takeaway</b>", bold_style)],
        [Paragraph("User Experience", bold_style), Paragraph("Familiar labels and clear actions improve usability.", body_style)],
        [Paragraph("Real-Time Behavior", bold_style), Paragraph("Live updates need careful state synchronization to prevent layout jumps.", body_style)],
        [Paragraph("Mobile Design", bold_style), Paragraph("Layout and navigation must be tested on actual smaller screens.", body_style)],
        [Paragraph("Performance", bold_style), Paragraph("Fast-feeling interactions require thoughtful client-side UI state handling.", body_style)],
        [Paragraph("Deployment", bold_style), Paragraph("Production testing reveals issues not visible during local development.", body_style)]
    ]
    t6 = Table(lessons_data, colWidths=[130, 330])
    t6.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B1B54")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#2B1B54")),
        ('BACKGROUND', (0,1), (-1,-1), COLOR_DARK_CARD),
    ]))
    story.append(t6)
    story.append(PageBreak())
    
    # ─── PAGE 11 — SCREENSHOT GALLERY ────────────────────────────────────────
    story.append(Paragraph("Platform Preview", h1_style))
    story.append(Spacer(1, 10))
    
    gal1 = get_browser_frame(IMAGE_PATHS["feed"], width=200, height=110)
    gal2 = get_browser_frame(IMAGE_PATHS["profile"], width=200, height=110)
    gal3 = get_browser_frame(IMAGE_PATHS["download"], width=200, height=110)
    gal4 = get_phone_frame(IMAGE_PATHS["mobile"], width=90, height=160)
    
    # Layout gallery grid
    # Left column contains two desktop screenshots, right column contains download mock + mobile mock
    t_gallery = Table([[gal1, gal3], [gal2, gal4]], colWidths=[230, 230])
    t_gallery.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_gallery)
    
    # Captions block
    caption_style = ParagraphStyle('Caption', parent=body_style, fontSize=8.5, textColor=COLOR_SECONDARY, alignment=1)
    story.append(Spacer(1, 10))
    story.append(Paragraph("Gallery Highlights: Responsive Feed (top-left), Profile Feed (bottom-left), secure Android APK Download Splash (top-right), Mobile wrapper rendering (bottom-right).", caption_style))
    story.append(PageBreak())
    
    # ─── PAGE 12 — FINAL PAGE ────────────────────────────────────────────────
    story.append(Spacer(1, 40))
    if os.path.exists(IMAGE_PATHS["logo"]):
        story.append(Image(IMAGE_PATHS["logo"], width=64, height=64, hAlign='CENTER'))
        story.append(Spacer(1, 20))
        
    story.append(Paragraph("Explore UNSEEN", title_style))
    story.append(Spacer(1, 15))
    story.append(Paragraph("A Privacy-Focused Social Platform", subtitle_style))
    story.append(Spacer(1, 30))
    
    story.append(Paragraph("Scan QR code below or visit the link to open the live experience:", ParagraphStyle('CenBody', parent=body_style, alignment=1)))
    story.append(Spacer(1, 20))
    
    # Render vector QR code
    qr_drawing = make_qr_code_drawing(size=100)
    t_qr = Table([[qr_drawing]], colWidths=[120])
    t_qr.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_qr)
    story.append(Spacer(1, 25))
    
    story.append(Paragraph("<u>https://unseen-world.vercel.app/</u>", link_style))
    story.append(Spacer(1, 40))
    
    story.append(Paragraph("Feedback and suggestions are welcome.", ParagraphStyle('CenBody2', parent=body_style, alignment=1, textColor=COLOR_TEXT_MUTED)))
    
    story.append(Spacer(1, 120))
    
    footer_style = ParagraphStyle('Footer', parent=body_style, alignment=1, fontSize=8, textColor=colors.HexColor("#A78BFA"))
    story.append(Paragraph("UNSEEN — Web Platform + Android APK", footer_style))
    
    # Build the document
    doc.build(story, onFirstPage=draw_page_decorations, onLaterPages=draw_page_decorations)
    print("UNSEEN_Public_Project_Case_Study.pdf generated successfully!")

if __name__ == "__main__":
    generate_pdf()

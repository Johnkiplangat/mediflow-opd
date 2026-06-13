
# ============================================================
# MediFlow OPD — Complete Page Generator & Sidebar Fixer
# Run this in your mediflow-opd project folder
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MediFlow Page Generator & Fixer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define all navigation items
$navItems = @(
    @{ file="mediflow-dashboard.html"; name="Dashboard"; icon="fa-gauge-high" },
    @{ file="mediflow-patients.html"; name="Patients"; icon="fa-users" },
    @{ file="mediflow-visits.html"; name="Visits"; icon="fa-hospital-user"; badge="12" },
    @{ file="mediflow-consultation-ui.html"; name="Consultations"; icon="fa-stethoscope" },
    @{ file="mediflow-laboratory.html"; name="Laboratory"; icon="fa-flask" },
    @{ file="mediflow-pharmacy.html"; name="Pharmacy"; icon="fa-pills" },
    @{ file="mediflow-billing.html"; name="Billing"; icon="fa-file-invoice-dollar" },
    @{ file="mediflow-analytics.html"; name="Analytics"; icon="fa-chart-line" }
)

function Get-Sidebar($activeFile) {
    $html = @"
<nav class="sidebar">
    <a href="mediflow-dashboard.html" class="sidebar-brand">
        <i class="fas fa-heart-pulse"></i>
        <span>MediFlow</span>
    </a>
"@
    foreach ($item in $navItems) {
        $activeClass = if ($item.file -eq $activeFile) { "active" } else { "" }
        $badgeHtml = if ($item.badge) { "<span class=`"nav-badge`">$($item.badge)</span>" } else { "" }
        $html += @"
    <a href="$($item.file)" class="nav-item $activeClass">
        <i class="fas $($item.icon)"></i>
        <span>$($item.name)</span>$badgeHtml
    </a>
"@
    }
    $html += @"
    <div style="margin-top: auto; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <a href="mediflow-settings.html" class="nav-item">
            <i class="fas fa-gear"></i>
            <span>Settings</span>
        </a>
        <a href="mediflow-login.html" class="nav-item" onclick="logout()">
            <i class="fas fa-right-from-bracket"></i>
            <span>Logout</span>
        </a>
    </div>
</nav>
"@
    return $html
}

# ============================================================
# PAGE TEMPLATES
# ============================================================

function Get-PageTemplate($title, $activeFile, $content) {
    $sidebar = Get-Sidebar $activeFile
    return @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediFlow OPD — $title</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
    <style>
        :root { --primary: #2563eb; --primary-dark: #1d4ed8; --success: #059669; --warning: #d97706; --danger: #dc2626; --info: #0891b2; --dark: #1e293b; --light: #f8fafc; --border: #e2e8f0; }
        * { box-sizing: border-box; }
        body { background: #f1f5f9; font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; }
        .sidebar { width: 260px; background: var(--dark); color: white; position: fixed; top: 0; left: 0; bottom: 0; padding: 1.5rem 1rem; overflow-y: auto; z-index: 1000; }
        .sidebar-brand { font-size: 1.4rem; font-weight: 700; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.75rem; color: white; text-decoration: none; }
        .sidebar-brand i { color: var(--primary); }
        .nav-item { padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.75rem; color: #94a3b8; text-decoration: none; font-size: 0.9375rem; }
        .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
        .nav-item i { width: 20px; text-align: center; }
        .nav-badge { margin-left: auto; background: var(--danger); color: white; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 1rem; font-weight: 700; }
        .main-content { margin-left: 260px; padding: 1.5rem 2rem; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: var(--dark); }
        .card { border: none; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; background: white; }
        .card-header { background: white; border-bottom: 1px solid var(--border); padding: 1.25rem 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; border-radius: 1rem 1rem 0 0 !important; }
        .card-header i { color: var(--primary); }
        .card-body { padding: 1.5rem; }
        .form-control, .form-select { border: 1.5px solid var(--border); border-radius: 0.625rem; padding: 0.75rem 1rem; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .btn-primary-custom { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); border: none; border-radius: 0.625rem; padding: 0.75rem 1.5rem; font-weight: 700; color: white; }
        @media (max-width: 991px) { .sidebar { width: 70px; padding: 1rem 0.5rem; } .sidebar-brand span, .nav-item span, .nav-badge { display: none; } .main-content { margin-left: 70px; padding: 1rem; } }
    </style>
</head>
<body>
$sidebar
<main class="main-content">
    <div class="top-bar">
        <div>
            <h1 class="page-title">$title</h1>
            <p style="color: #94a3b8; font-size: 0.875rem; margin: 0;">$($content.Subtitle)</p>
        </div>
        $($content.TopButton)
    </div>
    $($content.Body)
</main>
<script>function logout() { localStorage.clear(); }</script>
</body>
</html>
"@
}

# ============================================================
# PATIENTS PAGE
# ============================================================
$patientsContent = @{
    Subtitle = "Manage patient records and registrations"
    TopButton = '<a href="mediflow-register.html" class="btn-primary-custom" style="text-decoration: none;"><i class="fas fa-plus me-2"></i>Register New Patient</a>'
    Body = @"
    <div class="card">
        <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.75rem;"><i class="fas fa-users" style="color: var(--primary);"></i>All Patients</div>
            <input type="text" class="form-control" placeholder="Search patients..." style="width: 250px;">
        </div>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-md-6 col-lg-4">
                    <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid var(--border);">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #c084fc, #a855f7); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">AN</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--dark);">Amara Nwosu</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00001 &bull; Female, 36y</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem; color: #64748b;">
                            <div><i class="fas fa-phone me-1 text-primary"></i>0244123456</div>
                            <div><i class="fas fa-shield-halved me-1 text-info"></i>NHIS</div>
                        </div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye me-1"></i>View</button>
                            <button class="btn btn-sm btn-outline-success"><i class="fas fa-hospital-user me-1"></i>Visit</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid var(--border);">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #60a5fa, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">KM</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--dark);">Kofi Mensah</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00002 &bull; Male, 52y</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem; color: #64748b;">
                            <div><i class="fas fa-phone me-1 text-primary"></i>0244234567</div>
                            <div><i class="fas fa-shield-halved me-1 text-info"></i>NHIS</div>
                        </div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye me-1"></i>View</button>
                            <button class="btn btn-sm btn-outline-success"><i class="fas fa-hospital-user me-1"></i>Visit</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid var(--border);">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f472b6, #ec4899); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">AO</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: var(--dark);">Abena Owusu</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00003 &bull; Female, 28y</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem; color: #64748b;">
                            <div><i class="fas fa-phone me-1 text-primary"></i>0244345678</div>
                            <div><i class="fas fa-shield-halved me-1 text-info"></i>Private</div>
                        </div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye me-1"></i>View</button>
                            <button class="btn btn-sm btn-outline-success"><i class="fas fa-hospital-user me-1"></i>Visit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"@
}

# ============================================================
# VISITS PAGE
# ============================================================
$visitsContent = @{
    Subtitle = "Track and manage all patient visits"
    TopButton = '<button class="btn-primary-custom" onclick="window.location.href=''mediflow-register.html''"><i class="fas fa-plus me-2"></i>New Visit</button>'
    Body = @"
    <div class="card">
        <div class="card-header">
            <div style="display: flex; align-items: center; gap: 0.75rem;"><i class="fas fa-list-ol" style="color: var(--primary);"></i>Today's Visits</div>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" class="form-control" placeholder="Search visits..." style="width: 200px;">
                <select class="form-select" style="width: 130px;"><option>All Status</option><option>Waiting</option><option>In Progress</option><option>Completed</option></select>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                <div style="width: 36px; height: 36px; border-radius: 0.5rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">12</div>
                <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Amara Nwosu</div><div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00001 &bull; V-2026-00001</div></div>
                <div style="font-size: 0.875rem; color: #64748b; flex: 1;">Fever, chills, body aches</div>
                <span style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.875rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; background: #f0fdf4; color: var(--success);"><i class="fas fa-stethoscope"></i> In Consultation</span>
                <div style="font-size: 0.8rem; color: #94a3b8; width: 80px;">25 min</div>
                <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                <div style="width: 36px; height: 36px; border-radius: 0.5rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">13</div>
                <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Kofi Mensah</div><div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00002 &bull; V-2026-00002</div></div>
                <div style="font-size: 0.875rem; color: #64748b; flex: 1;">Chest pain, shortness of breath</div>
                <span style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.875rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; background: #eff6ff; color: var(--primary);"><i class="fas fa-heart-pulse"></i> In Triage</span>
                <div style="font-size: 0.8rem; color: #94a3b8; width: 80px;">15 min</div>
                <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                <div style="width: 36px; height: 36px; border-radius: 0.5rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">14</div>
                <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Abena Owusu</div><div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00003 &bull; V-2026-00003</div></div>
                <div style="font-size: 0.875rem; color: #64748b; flex: 1;">Toothache, lower left jaw</div>
                <span style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.875rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; background: #fefce8; color: #a16207;"><i class="fas fa-clock"></i> Waiting</span>
                <div style="font-size: 0.8rem; color: #94a3b8; width: 80px;">10 min</div>
                <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;">
                <div style="width: 36px; height: 36px; border-radius: 0.5rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">11</div>
                <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Ama Serwaa</div><div style="font-size: 0.8rem; color: #94a3b8;">PAT-2026-00007 &bull; V-2026-00007</div></div>
                <div style="font-size: 0.875rem; color: #64748b; flex: 1;">Skin rash, itching</div>
                <span style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.875rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; background: #f1f5f9; color: #64748b;"><i class="fas fa-check"></i> Completed</span>
                <div style="font-size: 0.8rem; color: #94a3b8; width: 80px;">1 hr</div>
                <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
            </div>
        </div>
    </div>
"@
}

# ============================================================
# LABORATORY PAGE
# ============================================================
$labContent = @{
    Subtitle = "Manage lab tests and results"
    TopButton = '<button class="btn-primary-custom" onclick="alert(''Order new lab test'')"><i class="fas fa-plus me-2"></i>Order Test</button>'
    Body = @"
    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">
                    <div style="display: flex; align-items: center; gap: 0.75rem;"><i class="fas fa-list-check" style="color: var(--primary);"></i>Pending Lab Orders</div>
                    <input type="text" class="form-control" placeholder="Search orders..." style="width: 200px;">
                </div>
                <div class="card-body">
                    <div style="background: white; border-radius: 0.75rem; padding: 1rem; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                        <div style="width: 44px; height: 44px; border-radius: 0.625rem; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-vial"></i></div>
                        <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Malaria Rapid Diagnostic Test (RDT)</div><div style="font-size: 0.8rem; color: #94a3b8;">Amara Nwosu &bull; V-2026-00001 &bull; Ordered 10:30 AM</div></div>
                        <span style="padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; background: #fefce8; color: #a16207;">Pending</span>
                        <button class="btn btn-sm btn-primary"><i class="fas fa-pen me-1"></i>Enter Result</button>
                    </div>
                    <div style="background: white; border-radius: 0.75rem; padding: 1rem; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                        <div style="width: 44px; height: 44px; border-radius: 0.625rem; background: #f0fdf4; color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-vial"></i></div>
                        <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Full Blood Count (FBC)</div><div style="font-size: 0.8rem; color: #94a3b8;">Amara Nwosu &bull; V-2026-00001 &bull; Ordered 10:32 AM</div></div>
                        <span style="padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; background: #fefce8; color: #a16207;">Pending</span>
                        <button class="btn btn-sm btn-primary"><i class="fas fa-pen me-1"></i>Enter Result</button>
                    </div>
                    <div style="background: white; border-radius: 0.75rem; padding: 1rem; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 44px; height: 44px; border-radius: 0.625rem; background: #f0fdf4; color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-vial"></i></div>
                        <div style="flex: 1;"><div style="font-weight: 700; color: var(--dark);">Widal Test</div><div style="font-size: 0.8rem; color: #94a3b8;">Kofi Mensah &bull; V-2026-00002 &bull; Ordered 10:45 AM</div></div>
                        <span style="padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; background: #f0fdf4; color: var(--success);">Completed</span>
                        <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye me-1"></i>View</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header"><i class="fas fa-book-medical" style="color: var(--primary);"></i>Lab Test Catalog</div>
                <div class="card-body">
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; font-size: 0.875rem;">Malaria RDT</span><span style="color: var(--primary); font-weight: 700;">&#8373;25</span></div>
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; font-size: 0.875rem;">Full Blood Count</span><span style="color: var(--primary); font-weight: 700;">&#8373;45</span></div>
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; font-size: 0.875rem;">Widal Test</span><span style="color: var(--primary); font-weight: 700;">&#8373;35</span></div>
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; font-size: 0.875rem;">Urinalysis</span><span style="color: var(--primary); font-weight: 700;">&#8373;20</span></div>
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; font-size: 0.875rem;">Blood Sugar (FBS)</span><span style="color: var(--primary); font-weight: 700;">&#8373;18</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"@
}

# ============================================================
# ANALYTICS PAGE
# ============================================================
$analyticsContent = @{
    Subtitle = "Hospital performance insights and reports"
    TopButton = '<select class="form-select" style="width: 150px;"><option>Last 7 Days</option><option>Last 30 Days</option><option>This Month</option><option>This Year</option></select>'
    Body = @"
    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div style="background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 0.75rem; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.25rem;"><i class="fas fa-hospital-user"></i></div>
                <div style="font-size: 1.75rem; font-weight: 800; color: var(--dark); line-height: 1;">156</div>
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Visits</div>
            </div>
        </div>
        <div class="col-md-3">
            <div style="background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 0.75rem; background: #f0fdf4; color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.25rem;"><i class="fas fa-users"></i></div>
                <div style="font-size: 1.75rem; font-weight: 800; color: var(--dark); line-height: 1;">89</div>
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">New Patients</div>
            </div>
        </div>
        <div class="col-md-3">
            <div style="background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 0.75rem; background: #fffbeb; color: var(--warning); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.25rem;"><i class="fas fa-cedi-sign"></i></div>
                <div style="font-size: 1.75rem; font-weight: 800; color: var(--dark); line-height: 1;">&#8373;8,450</div>
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Revenue</div>
            </div>
        </div>
        <div class="col-md-3">
            <div style="background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 0.75rem; background: #fef2f2; color: var(--danger); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.25rem;"><i class="fas fa-clock"></i></div>
                <div style="font-size: 1.75rem; font-weight: 800; color: var(--dark); line-height: 1;">18 min</div>
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Avg Wait Time</div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header"><i class="fas fa-chart-column" style="color: var(--primary);"></i>Visits by Department</div>
                <div class="card-body">
                    <div style="margin-bottom: 1.5rem;"><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">General Medicine</span><span style="font-weight: 700;">45%</span></div><div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem;"><div style="height: 100%; border-radius: 4px; width: 45%; background: var(--primary);"></div></div></div>
                    <div style="margin-bottom: 1.5rem;"><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Dental</span><span style="font-weight: 700;">28%</span></div><div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem;"><div style="height: 100%; border-radius: 4px; width: 28%; background: var(--info);"></div></div></div>
                    <div style="margin-bottom: 1.5rem;"><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Laboratory</span><span style="font-weight: 700;">15%</span></div><div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem;"><div style="height: 100%; border-radius: 4px; width: 15%; background: var(--success);"></div></div></div>
                    <div style="margin-bottom: 1.5rem;"><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Pharmacy</span><span style="font-weight: 700;">12%</span></div><div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 0.5rem;"><div style="height: 100%; border-radius: 4px; width: 12%; background: var(--warning);"></div></div></div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header"><i class="fas fa-stethoscope" style="color: var(--primary);"></i>Top Diagnoses</div>
                <div class="card-body">
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Malaria</span><span class="badge bg-danger">32</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Hypertension</span><span class="badge bg-warning">24</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Dental Caries</span><span class="badge bg-info">18</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Typhoid</span><span class="badge bg-primary">15</span></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;"><span style="font-weight: 600; font-size: 0.875rem;">Respiratory Infection</span><span class="badge bg-secondary">12</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"@
}

# ============================================================
# SETTINGS PAGE
# ============================================================
$settingsContent = @{
    Subtitle = "Configure your MediFlow system"
    TopButton = ''
    Body = @"
    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header"><i class="fas fa-hospital"></i>Hospital Information</div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6"><label class="form-label">Hospital Name</label><input type="text" class="form-control" value="MediFlow Hospital"></div>
                        <div class="col-md-6"><label class="form-label">Department</label><input type="text" class="form-control" value="Outpatient Department (OPD)"></div>
                        <div class="col-md-6"><label class="form-label">Phone</label><input type="tel" class="form-control" value="0302-000-000"></div>
                        <div class="col-md-6"><label class="form-label">Email</label><input type="email" class="form-control" value="info@mediflow.local"></div>
                        <div class="col-12"><label class="form-label">Address</label><textarea class="form-control" rows="2">123 Hospital Road, Accra, Ghana</textarea></div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><i class="fas fa-sliders"></i>System Preferences</div>
                <div class="card-body">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border);"><div><h6 style="margin: 0; font-weight: 700; color: var(--dark); font-size: 0.95rem;">Auto-refresh Dashboard</h6><p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Automatically refresh patient queue every 30 seconds</p></div><div style="width: 48px; height: 26px; background: var(--primary); border-radius: 13px; position: relative; cursor: pointer;"><div style="width: 22px; height: 22px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div></div></div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border);"><div><h6 style="margin: 0; font-weight: 700; color: var(--dark); font-size: 0.95rem;">SMS Notifications</h6><p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Send SMS alerts to patients for appointments and results</p></div><div style="width: 48px; height: 26px; background: var(--primary); border-radius: 13px; position: relative; cursor: pointer;"><div style="width: 22px; height: 22px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div></div></div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border);"><div><h6 style="margin: 0; font-weight: 700; color: var(--dark); font-size: 0.95rem;">Email Notifications</h6><p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Send email receipts and discharge instructions</p></div><div style="width: 48px; height: 26px; background: #e2e8f0; border-radius: 13px; position: relative; cursor: pointer;"><div style="width: 22px; height: 22px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div></div></div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0;"><div><h6 style="margin: 0; font-weight: 700; color: var(--dark); font-size: 0.95rem;">AI Diagnosis Assistant</h6><p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Enable AI-powered differential diagnosis suggestions</p></div><div style="width: 48px; height: 26px; background: var(--primary); border-radius: 13px; position: relative; cursor: pointer;"><div style="width: 22px; height: 22px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div></div></div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header"><i class="fas fa-shield-halved"></i>Security</div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary"><i class="fas fa-key me-2"></i>Change Password</button>
                        <button class="btn btn-outline-primary"><i class="fas fa-fingerprint me-2"></i>Two-Factor Auth</button>
                        <button class="btn btn-outline-danger"><i class="fas fa-trash me-2"></i>Clear Cache</button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><i class="fas fa-circle-info"></i>About</div>
                <div class="card-body">
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--info)); border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; font-size: 1.5rem;"><i class="fas fa-heart-pulse"></i></div>
                        <h5 style="font-weight: 700; color: var(--dark);">MediFlow OPD</h5>
                        <p style="color: #94a3b8; font-size: 0.875rem;">Version 3.1.0</p>
                        <p style="color: #94a3b8; font-size: 0.8rem;">&copy; 2026 MediFlow Systems</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end gap-2" style="margin-top: 1rem;">
        <button class="btn btn-outline-secondary">Cancel</button>
        <button class="btn-primary-custom" onclick="alert('Settings saved!')"><i class="fas fa-floppy-disk me-2"></i>Save Changes</button>
    </div>
"@
}

# ============================================================
# GENERATE PAGES
# ============================================================

$pages = @(
    @{ file="mediflow-patients.html"; title="Patients"; content=$patientsContent },
    @{ file="mediflow-visits.html"; title="Visits"; content=$visitsContent },
    @{ file="mediflow-laboratory.html"; title="Laboratory"; content=$labContent },
    @{ file="mediflow-analytics.html"; title="Analytics"; content=$analyticsContent },
    @{ file="mediflow-settings.html"; title="Settings"; content=$settingsContent }
)

$created = 0
foreach ($page in $pages) {
    $html = Get-PageTemplate $page.title $page.file $page.content
    $html | Out-File -FilePath $page.file -Encoding UTF8
    Write-Host "  ✅ Created: $($page.file)" -ForegroundColor Green
    $created++
}

# ============================================================
# FIX EXISTING PAGES (replace sidebar)
# ============================================================

$existingPages = @(
    "mediflow-dashboard.html",
    "mediflow-consultation-ui.html",
    "mediflow-billing.html",
    "mediflow-register.html"
)

$fixed = 0
foreach ($file in $existingPages) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $newSidebar = Get-Sidebar $file

        # Replace sidebar nav block
        $pattern = '(?s)<nav class="sidebar">.*?</nav>'
        if ($content -match $pattern) {
            $newContent = [regex]::Replace($content, $pattern, $newSidebar, [System.Text.RegularExpressions.RegexOptions]::Singleline)
            $newContent | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            Write-Host "  ✅ Fixed sidebar: $file" -ForegroundColor Green
            $fixed++
        } else {
            Write-Host "  ⚠️  Sidebar not found in: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ File not found: $file" -ForegroundColor Red
    }
}

# ============================================================
# SUMMARY
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  New pages created: $created" -ForegroundColor White
Write-Host "  Existing pages fixed: $fixed" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the new files in your folder" -ForegroundColor White
Write-Host "  2. git add ." -ForegroundColor DarkGray
Write-Host "  3. git commit -m 'Add missing pages and fix navigation'" -ForegroundColor DarkGray
Write-Host "  4. git push origin main" -ForegroundColor DarkGray
Write-Host "  5. Check Render for auto-deploy" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

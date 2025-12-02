			
			<header class="app-header sticky" id="header">

				<!-- Start::main-header-container -->
				<div class="main-header-container container-fluid">

					<!-- Start::header-content-left -->
					<div class="header-content-left">

						<!-- Start::header-element -->
						<div class="header-element">
							<div class="horizontal-logo">
								<a href="{{url('index')}}" class="header-logo">
									<img src="{{asset('build/assets/images/brand-logos/desktop-logo.png')}}" alt="logo" class="desktop-logo">
									<img src="{{asset('build/assets/images/brand-logos/toggle-logo.png')}}" alt="logo" class="toggle-logo">
									<img src="{{asset('build/assets/images/brand-logos/desktop-dark.png')}}" alt="logo" class="desktop-dark">
									<img src="{{asset('build/assets/images/brand-logos/toggle-dark.png')}}" alt="logo" class="toggle-dark">
								</a>
							</div>
						</div>
						<!-- End::header-element -->

						<!-- Start::header-element -->
						<div class="header-element mx-lg-0 mx-2">
							<a aria-label="Hide Sidebar" class="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle" data-bs-toggle="sidebar" href="javascript:void(0);"><span></span></a>
						</div>
						<!-- End::header-element -->

						<div class="header-element header-search d-md-block d-none">
							<!-- Start::header-link -->
							<input type="text" class="header-search-bar form-control bg-white" id="header-search" placeholder="Search" spellcheck=false autocomplete="off" autocapitalize="off">
							<a href="javascript:void(0);" class="header-search-icon border-0">
								<i class="bi bi-search fs-12"></i>
							</a>
							<!-- End::header-link -->
						</div>

					</div>
					<!-- End::header-content-left -->

									<!-- Start::header-content-right -->
				<ul class="header-content-right">
					<li class="header-element profile-1 dropdown">
						<a href="javascript:void(0);" class="dropdown-toggle" data-bs-toggle="dropdown">
							<div class="d-flex align-items-center">
								<div class="me-sm-2 me-0 avatar avatar-md avatar-rounded">
									<img src="{{asset('" + "build/assets/images/faces/9.jpg')}}" alt="img">
								</div>
								<div class="flex-grow-1 d-sm-block d-none">
									<p class="fw-semibold mb-0 lh-1">{{ auth()->user()->name ?? 'User'}}</p>
									<span class="op-7 fw-normal d-block fs-11">{{ auth()->user()->email ?? ''}}</span>
								</div>
							</div>
						</a>
						<ul class="main-header-dropdown dropdown-menu dropdown-menu-end" data-popper-placement="none">
							<li><a class="dropdown-item d-flex align-items-center" href="{{ route('" + "profile.show') }}">Profile</a></li>
							<li>
								<form method="POST" action="{{ route('" + "logout') }}">
									@csrf
									<button type="submit" class="dropdown-item d-flex align-items-center text-danger">Logout</button>
								</form>
							</li>
						</ul>
					</li>
				</ul>
				<!-- End::header-content-right -->

				</div>
				<!-- End::main-header-container -->

			</header>
					

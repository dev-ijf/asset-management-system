
        <aside class="app-sidebar sticky" id="sidebar">

            <div class="container px-0">
                <!-- Start::main-sidebar -->
                <div class="main-sidebar">

                    <!-- Start::nav -->
                    <nav class="main-menu-container nav nav-pills sub-open">
                        <div class="landing-logo-container">
                            <div class="horizontal-logo">
                                <a href="{{url('index')}}" class="header-logo">
                                    <img src="{{asset('build/assets/images/brand-logos/desktop-logo.png')}}" alt="logo" class="desktop-logo">
                                    <img src="{{asset('build/assets/images/brand-logos/desktop-dark.png')}}" alt="logo" class="desktop-dark">
                                </a>
                            </div>
                        </div>
                        <div class="slide-left" id="slide-left"><svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"> <path d="M13.293 6.293 7.586 12l5.707 5.707 1.414-1.414L10.414 12l4.293-4.293z"></path> </svg></div>
                        <ul class="main-menu flex-fill justify-content-center">
                            <!-- Start::slide -->
                            <li class="slide">
                        <a class="side-menu__item" href="#home">
                            <span class="side-menu__label">Beranda</span>
                        </a>
                    </li>
                    <!-- End::slide -->
                    <!-- Start::slide -->
                    <li class="slide">
                        <a href="#feature" class="side-menu__item">
                            <span class="side-menu__label">Fitur</span>
                        </a>
                    </li>
                    <!-- End::slide -->
                    <!-- Start::slide -->
                    <li class="slide">
                        <a href="#service" class="side-menu__item">
                            <span class="side-menu__label">Alur</span>
                        </a>
                    </li>
                    <!-- End::slide -->
                    <!-- Start::slide -->
                    <li class="slide">
                        <a href="#price" class="side-menu__item">
                            <span class="side-menu__label">Pricing</span>
                        </a>
                    </li>
                    <!-- End::slide -->
                    <!-- Start::slide -->
                    <li class="slide">
                        <a href="#contactus" class="side-menu__item">
                            <span class="side-menu__label">Kontak</span>
                        </a>
                    </li>
                    <!-- End::slide -->
                        </ul>
                        <div class="slide-right" id="slide-right"><svg xmlns="http://www.w3.org/2000/svg" fill="#7b8191" width="24" height="24" viewBox="0 0 24 24"> <path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"></path> </svg></div>
                        <div class="d-lg-flex d-none align-items-center">
                            <div class="btn-list d-xl-flex d-none">
                                <a href="{{ route('login') }}" class="btn btn-wave btn-primary border">
                                    Login / Register
                                </a>
                            </div>
                            
                            <a href="javascript:void(0);" class="btn btn-icon btn-primary-light switcher-icon" data-bs-toggle="offcanvas" data-bs-target="#switcher-canvas">
                                <i class="ti ti-settings"></i>
                            </a>
                        </div>    
                    </nav>
                    <!-- End::nav -->

                </div>
                <!-- End::main-sidebar -->
            </div>

        </aside>

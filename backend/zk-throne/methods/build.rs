// Build script for RISC Zero methods
// This compiles the guest program to RISC-V

use risc0_build::{embed_methods_with_options, DockerOptions, GuestOptions};

fn main() {
    // Build guest program with options
    let guest_opts = GuestOptions::default();
    
    // Use Docker for reproducible builds (optional)
    let docker_opts = DockerOptions::default();
    
    // Embed the compiled guest methods
    embed_methods_with_options(guest_opts);
}

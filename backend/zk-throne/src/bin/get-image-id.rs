// Utility to extract RISC Zero image ID

use throne_methods::TRIAL_VERIFY_ID;

fn main() {
    println!("RISC Zero Image ID:");
    println!("==================");
    println!();
    println!("Image ID (8 x u32):");
    println!("{:?}", TRIAL_VERIFY_ID);
    println!();
    println!("Image ID (hex):");
    let hex_str: String = TRIAL_VERIFY_ID
        .iter()
        .map(|n| format!("{:08x}", n))
        .collect::<Vec<_>>()
        .join("");
    println!("{}", hex_str);
    println!();
    println!("For Soroban BytesN<32>, use:");
    println!("0x{}", hex_str);
}

import Container from "@/components/global/Container";
import ThemeMode from "@/components/navbar/ThemeMode";
import Logo from "@/components/Logo";

export default function Navbar() 
{
    return (
        <nav>
            <Container className="flex flex-row justify-between items-center w-full py-4">
                <Logo />
                <ThemeMode />
            </Container>
        </nav>
    );
}
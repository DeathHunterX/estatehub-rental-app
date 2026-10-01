const Header = ({ title, subtitle }: HeaderProps) => {
    return (
        <div className="mb-5">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
    );
};

export default Header;

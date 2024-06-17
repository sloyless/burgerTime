type Props = {
  children: React.ReactNode;
};

function FieldSet({ children }: Readonly<Props>) {
  return (
    <fieldset className="border border-slate-400 bg-slate-300 px-6 py-4 lg:flex lg:content-center lg:justify-between lg:gap-5">
      {children}
    </fieldset>
  );
}

export default FieldSet;

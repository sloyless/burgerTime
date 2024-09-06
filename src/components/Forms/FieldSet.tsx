type Props = {
  children: React.ReactNode;
};

function FieldSet({ children }: Readonly<Props>) {
  return (
    <fieldset className="bg-slate-300 px-6 pt-4 md:flex md:justify-between md:gap-5 md:border md:border-slate-400 md:pb-4 lg:content-center">
      {children}
    </fieldset>
  );
}

export default FieldSet;

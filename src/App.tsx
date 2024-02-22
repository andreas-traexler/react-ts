import { memo, useCallback, useEffect } from 'react'
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form'
import './App.css'

const RecursiveFormFieldRenderer = memo(({ name: name }) => {
  const { register, getValues } = useFormContext();

  const itemValue = getValues(name);

  if (itemValue == null) return null;

  if (Array.isArray(itemValue) && name.endsWith("creators")) {
    return <div>
      <CreatorTypeDropDown name={name} />
    </div>
  }

  if (name.endsWith("itemType")) {
    return <div>
      <TypeDropDown name={name} />
    </div>
  }

  if (typeof itemValue === 'string') {
    return <div>
      <label htmlFor={name}>{name}</label>
      <input id={name} type='text' {...register(name)} />
    </div>
  }

  if (typeof itemValue === "object") {
    console.log(name)
  }

  return <div>{Object.entries(itemValue).map(([key, value], index) => {
    return <div key={index}>
      <RecursiveFormFieldRenderer name={`${name}.${key}`} />
    </div>
  })}</div>
});

const TypeDropDown = ({ name }) => {
  const { register } = useFormContext();

  return <>
    <label htmlFor={name}>{name}</label>
    <select {...register(name)}>
      <option value="book">Buch</option>
      <option value="computerProgram">Software</option>
      <option value="note">Notiz</option>
    </select >
  </>


}

const CreatorTypeDropDown = ({ name }) => {
  const { register, getValues } = useFormContext();
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({ name })



  return <>
    {fields.map((field, index) => {
      return <div key={field.id}>
        <RecursiveFormFieldRenderer name={`${name}.${index}`} />
        <button type="button" onClick={() => {
          append(getValues(`${name}.${index}`))
        }}>Add</button>
        {fields.length > 1 &&
          <button type="button" onClick={() => remove(index)}>Remove</button>
        }
      </div>
    })}
  </>


}

function App() {

  const methods = useForm({
    defaultValues: async () => {
      let result = await (await fetch("https://api.zotero.org/items/new?itemType=book")).json();

      return {
        "item": result
      }
    }
  });

  const { reset, watch, control } = methods;

  const itemType = useWatch({ name: "item.itemType", control });

  const doReset = useCallback(async (itemType) => {
    let result = await (await fetch(`https://api.zotero.org/items/new?itemType=${itemType}`)).json();

    reset({
      "item": result
    }, { keepValues: false })
  }, [reset]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name == null || type == null) return;
      if (!name.endsWith("itemType")) return;

      setTimeout(async () => doReset(value.item.itemType), 0)
    })
    return () => {
      console.log("unsubscribing")
      subscription.unsubscribe()
    }
  }, [watch])

  return <div>
    <FormProvider {...methods}>
      <RecursiveFormFieldRenderer name={"item"} />
    </FormProvider>
  </div>
}

export default App

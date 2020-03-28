import { echo } from './api/rpc-file';

export async function getServerSideProps () {
  return {
    props: {
      data: (await echo('foo', 'bar')).join(' ')
    }
  }
}

export default function Index (props) {
  const [data, setData] = React.useState();
  React.useEffect(() => {
    (async () => {
      setData((await echo('baz', 'quux')).join(' '))
    })()
  })
  return (
    <div>
      <div id='ssr'>{props.data}</div>
      { data ? <div id='browser'>{data}</div> : null}
    </div>
  )
}
